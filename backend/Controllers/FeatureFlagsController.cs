using CloudBackend.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeatureFlagsController : ControllerBase
{
    private readonly FeatureFlags _flags;

    public FeatureFlagsController(IOptions<FeatureFlags> flags)
    {
        _flags = flags.Value;
    }

    /// <summary>
    /// Returns current feature flags. Public endpoint — no auth required.
    /// Frontend reads this on startup to conditionally render features.
    /// </summary>
    [HttpGet]
    public ActionResult<FeatureFlags> Get() => Ok(_flags);
}
