using CloudBackend.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;

namespace TaskManager.Tests;

public class CacheServiceTests
{
    // In-memory fake for IDistributedCache — no extra packages needed
    private sealed class FakeCache : IDistributedCache
    {
        private readonly Dictionary<string, byte[]> _store = new();

        public byte[]? Get(string key) => _store.TryGetValue(key, out var v) ? v : null;
        public Task<byte[]?> GetAsync(string key, CancellationToken t = default) =>
            Task.FromResult(Get(key));
        public void Set(string key, byte[] value, DistributedCacheEntryOptions opts) =>
            _store[key] = value;
        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions opts, CancellationToken t = default)
        { Set(key, value, opts); return Task.CompletedTask; }
        public void Refresh(string key) { }
        public Task RefreshAsync(string key, CancellationToken t = default) => Task.CompletedTask;
        public void Remove(string key) => _store.Remove(key);
        public Task RemoveAsync(string key, CancellationToken t = default)
        { Remove(key); return Task.CompletedTask; }
    }

    private static CacheService Build() =>
        new(new FakeCache(), NullLogger<CacheService>.Instance);

    [Fact]
    public async Task GetOrSetAsync_CacheMiss_CallsFactoryAndReturnsResult()
    {
        var svc = Build();
        var calls = 0;

        var result = await svc.GetOrSetAsync("key1", async () =>
        {
            calls++;
            return "hello";
        }, TimeSpan.FromMinutes(1));

        Assert.Equal("hello", result);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task GetOrSetAsync_CacheHit_DoesNotCallFactory()
    {
        var svc = Build();
        var calls = 0;

        await svc.GetOrSetAsync("key2", async () => { calls++; return 42; }, TimeSpan.FromMinutes(1));
        var result = await svc.GetOrSetAsync("key2", async () => { calls++; return 99; }, TimeSpan.FromMinutes(1));

        Assert.Equal(42, result);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task RemoveAsync_ClearsKey()
    {
        var svc = Build();
        await svc.GetOrSetAsync("key3", async () => "first", TimeSpan.FromMinutes(1));
        await svc.RemoveAsync("key3");
        var result = await svc.GetOrSetAsync("key3", async () => "second", TimeSpan.FromMinutes(1));
        Assert.Equal("second", result);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsTrueOnlyWhenKeyPresent()
    {
        var svc = Build();
        Assert.False(await svc.ExistsAsync("missing"));
        await svc.SetAsync("present", "value", TimeSpan.FromMinutes(1));
        Assert.True(await svc.ExistsAsync("present"));
    }

    [Fact]
    public async Task GetOrSetAsync_WhenCacheThrows_FallsBackToFactory()
    {
        var broken = new BrokenCache();
        var svc = new CacheService(broken, NullLogger<CacheService>.Instance);

        var result = await svc.GetOrSetAsync("k", async () => "fallback", TimeSpan.FromMinutes(1));

        Assert.Equal("fallback", result);
    }

    private sealed class BrokenCache : IDistributedCache
    {
        public byte[]? Get(string key) => throw new InvalidOperationException("Redis down");
        public Task<byte[]?> GetAsync(string key, CancellationToken t = default) =>
            throw new InvalidOperationException("Redis down");
        public void Set(string key, byte[] v, DistributedCacheEntryOptions o) =>
            throw new InvalidOperationException("Redis down");
        public Task SetAsync(string key, byte[] v, DistributedCacheEntryOptions o, CancellationToken t = default) =>
            throw new InvalidOperationException("Redis down");
        public void Refresh(string key) { }
        public Task RefreshAsync(string key, CancellationToken t = default) => Task.CompletedTask;
        public void Remove(string key) { }
        public Task RemoveAsync(string key, CancellationToken t = default) => Task.CompletedTask;
    }
}
