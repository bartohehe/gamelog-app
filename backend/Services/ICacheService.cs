namespace CloudBackend.Services;

public interface ICacheService
{
    /// <summary>
    /// Returns the cached value for <paramref name="key"/>. On miss, calls
    /// <paramref name="factory"/>, stores the result (with optional TTL), and returns it.
    /// ttl = null means no expiration.
    /// </summary>
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null);

    /// <summary>Unconditionally writes a value. ttl = null means no expiration.</summary>
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null);

    /// <summary>Removes a key from cache. No-op if key does not exist.</summary>
    Task RemoveAsync(string key);

    /// <summary>Returns true when the key exists in cache.</summary>
    Task<bool> ExistsAsync(string key);
}
