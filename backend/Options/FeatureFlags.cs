namespace CloudBackend.Options;

public class FeatureFlags
{
    public bool AuthEnabled { get; set; } = true;
    public bool MultiplayerEnabled { get; set; } = true;
    public bool SocialFeaturesEnabled { get; set; } = false;
    public bool ReviewsEnabled { get; set; } = true;
    public bool BacklogEnabled { get; set; } = true;
    public bool StatisticsEnabled { get; set; } = false;
    public bool TranslationEnabled { get; set; } = true;
}
