# ThreeAmigos Version Check API

This Cloudflare Worker provides a secure and cacheable API to check the **latest version of a FiveM resource** based on GitHub releases.

This is primarily designed for private repos for escrowed resources so you don't need to expose your access token in your resources, but it works fine with public repositories too.

It allows your FiveM resources to fetch version data from the github release via:

```
https://yourapidomain.com/versions/<resource-name>
```

## API Response

- Successful response
```json
{
  "resource": "TAM_WeaponRealism",
  "latestVersion": "v1.3.0",
  "releaseUrl": "https://github.com/threeamigosmodding/TAM_WeaponRealism/releases/tag/v1.3.0",
  "publishedAt": "2025-07-10T15:03:00Z"
}

```

- Error response. The error & resource will change depending on what failed.
```json
{
  "error": "Repository or release not found. Check that the resource exists and has at least one GitHub release.",
  "resource": "UnknownResource"
}
```


## Lua Example


Here's how you can utilize this in your resources.

```lua
CreateThread(function()
    PerformHttpRequest("https://api.threeamigos.shop/versions/TAM_WeaponRealism", function(statusCode, response, headers)
        if statusCode ~= 200 then
            lib.print.warn("[Version Checker]: Failed to fetch latest version from API.")
            return
        end

        local jsonData = json.decode(response)
        if not jsonData or not jsonData.latestVersion then
            lib.print.warn("[Version Checker]: Invalid API response.")
            return
        end

        local latestVersion = jsonData.latestVersion
        local currentVersion = GetResourceMetadata(GetCurrentResourceName(), "version", 0)

        if not currentVersion then
            lib.print.warn("[Version Checker]: No version metadata found in fxmanifest.")
            return
        end

        if currentVersion ~= latestVersion then
            lib.print.warn(("[Version Checker]: Outdated! Installed: %s, Latest: %s — Download the latest from CFX Portal."):format(currentVersion, latestVersion))
        else
            lib.print.info(("[Version Checker]: You are up to date! Version: %s"):format(currentVersion))
        end
    end, "GET", "", {})
end)
```

## Deploying your own

### Requirements:
> - A Cloudflare account
> - Node.js <= 20. I recommend using node version manager or volta
> - A domain (Optionally can use the cloudflare provided one)
> - A Github account w/ resources that have proper release tags
>  - Wrangler CLI

### Steps:

1. Clone the repository
2. Install packages (either w/ `pnpm i` or `npm i` etc)
3. Edit `src/index.ts` and change references of `ThreeAmigosModding` to your Github username/org. 
4. Optionally, setup a custom domain for the worker - https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
 - If you aren't going to be using a custom domain, you'll need to remove the route in `wranger.jsonc`.
5. Deploy to a Cloudflare worker via `pnpx wrangler deploy` or by going through the Cloudflare dashboard.


## License

This project is licensed under the **GNU General Public License v3.0**.  
You are free to use, modify, and distribute it under the terms of the license,  
as long as you credit the original authors and keep it under the same license.

See the full license text in [`LICENSE`](./LICENSE).

## Attribution Requirement

If you use or modify this project, **you must provide visible credit** to:

**Three Amigos Modding**  
GitHub: https://github.com/threeamigosmodding/version-api

This credit must appear:
- In the documentation or README of your project
- Or in an about/license section of your project

## Credits

Built by [Three Amigos Modding](https://github.com/threeamigosmodding) to provide secure and simple version tracking for FiveM resources.
