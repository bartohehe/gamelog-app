namespace CloudBackend.DTOs.Stats;

public class UserStatsDto
{
    public int TotalGames { get; set; }
    public int PlannedCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int AbandonedCount { get; set; }
    public double? AverageScore { get; set; }
}
