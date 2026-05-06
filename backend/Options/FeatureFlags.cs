namespace CloudBackend.Options;

public class FeatureFlags
{
    public bool SocialFeaturesEnabled { get; set; } = false;
    public bool ReviewsEnabled { get; set; } = true;
    public bool BacklogEnabled { get; set; } = true;
    public bool StatisticsEnabled { get; set; } = false;
}
