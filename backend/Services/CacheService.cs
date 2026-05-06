using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace CloudBackend.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null)
    {
        try
        {
            var bytes = await _cache.GetAsync(key);
            if (bytes != null)
                return JsonSerializer.Deserialize<T>(bytes, JsonOpts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis GET failed for key {Key} — falling back to source", key);
            return await factory();
        }

        var value = await factory();

        if (value != null)
        {
            try
            {
                var opts = new DistributedCacheEntryOptions();
                if (ttl.HasValue) opts.AbsoluteExpirationRelativeToNow = ttl;
                await _cache.SetAsync(key, JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts), opts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis SET failed for key {Key} — result not cached", key);
            }
        }

        return value;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null)
    {
        try
        {
            var opts = new DistributedCacheEntryOptions();
            if (ttl.HasValue) opts.AbsoluteExpirationRelativeToNow = ttl;
            await _cache.SetAsync(key, JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts), opts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try { await _cache.RemoveAsync(key); }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis REMOVE failed for key {Key}", key);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            // IDistributedCache has no native key-exists primitive; fetching bytes is the only option.
            // For small sentinel values (e.g. cooldown flags) the overhead is negligible.
            return await _cache.GetAsync(key) != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis EXISTS failed for key {Key}", key);
            return false;
        }
    }
}
