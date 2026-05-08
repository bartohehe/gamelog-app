using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CloudBackend.Services;

public interface ITranslationService
{
    Task<string?> TranslateToPolishAsync(string text);
}

public class TranslationService : ITranslationService
{
    private readonly HttpClient _http;
    private readonly ICacheService _cache;
    private readonly ILogger<TranslationService> _logger;

    // MyMemory free tier: max 500 chars per request
    private const int ChunkSize = 450;

    public TranslationService(HttpClient http, ICacheService cache, ILogger<TranslationService> logger)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> TranslateToPolishAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)))[..16].ToLower();
        var cacheKey = $"translate:pl:{hash}";

        return await _cache.GetOrSetAsync<string>(cacheKey, async () =>
        {
            var chunks = SplitIntoChunks(text, ChunkSize);
            var parts = new List<string>();
            foreach (var chunk in chunks)
            {
                var result = await TranslateChunkAsync(chunk);
                parts.Add(result ?? chunk); // fall back to original on error
            }
            return string.Join(" ", parts);
        }, TimeSpan.FromDays(30));
    }

    private async Task<string?> TranslateChunkAsync(string text)
    {
        try
        {
            var encoded = Uri.EscapeDataString(text);
            var url = $"https://api.mymemory.translated.net/get?q={encoded}&langpair=en|pl";
            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);
            var translated = json.RootElement
                .GetProperty("responseData")
                .GetProperty("translatedText")
                .GetString();
            return translated;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Translation failed for chunk, returning original");
            return null;
        }
    }

    private static List<string> SplitIntoChunks(string text, int maxLen)
    {
        if (text.Length <= maxLen) return [text];

        var chunks = new List<string>();
        var remaining = text.AsSpan();

        while (remaining.Length > maxLen)
        {
            // prefer splitting at sentence boundary
            var cutAt = -1;
            for (var i = Math.Min(maxLen - 1, remaining.Length - 1); i >= maxLen / 2; i--)
            {
                if (remaining[i] is '.' or '!' or '?')
                {
                    cutAt = i;
                    break;
                }
            }
            if (cutAt < 0)
            {
                // fall back to last space
                for (var i = Math.Min(maxLen - 1, remaining.Length - 1); i >= 0; i--)
                {
                    if (remaining[i] == ' ') { cutAt = i - 1; break; }
                }
            }
            if (cutAt < 0) cutAt = maxLen - 1;

            chunks.Add(remaining[..(cutAt + 1)].ToString().Trim());
            remaining = remaining[(cutAt + 1)..].TrimStart();
        }

        if (remaining.Length > 0) chunks.Add(remaining.ToString());
        return chunks;
    }
}
