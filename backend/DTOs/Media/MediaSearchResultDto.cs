namespace CloudBackend.DTOs.Media;

public record MediaSearchResultDto(
    string ExternalId,
    string Title,
    string Type,
    int Year,
    List<string> Genres,
    string Creator,
    string? CoverImageUrl,
    string? Runtime,
    int? Episodes,
    int? CriticScore,
    int Popularity
);
