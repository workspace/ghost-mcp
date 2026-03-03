/**
 * HTML page rendering for admin login and settings pages.
 *
 * Uses the same visual style as the original authorization page
 * (.card, .hint, .error, etc.).
 */

/**
 * Escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const BASE_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #15171a; }
    p.desc { color: #738a94; margin-bottom: 1.5rem; font-size: 0.9rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.25rem; color: #15171a; font-size: 0.9rem; }
    input[type="text"], input[type="url"], input[type="password"] { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #dfe1e3; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #15171a; }
    .hint { color: #738a94; font-size: 0.8rem; margin-top: -0.75rem; margin-bottom: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #15171a; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #2c3039; }
    .error { color: #e25440; font-size: 0.85rem; margin-bottom: 1rem; }
    .success { color: #30cf43; font-size: 0.85rem; margin-bottom: 1rem; }
`;

/**
 * Renders the admin login page.
 */
export function renderLoginPage(params: {
  error?: string;
  returnTo?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Ghost MCP</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Admin Login</h1>
    <p class="desc">Enter the admin password to configure Ghost MCP.</p>
    ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ''}
    <form method="POST" action="/login">
      ${params.returnTo ? `<input type="hidden" name="returnTo" value="${escapeHtml(params.returnTo)}" />` : ''}
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Admin password" required autofocus />
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`;
}

/**
 * Renders the Ghost settings page.
 */
export function renderSettingsPage(params: {
  ghostUrl?: string;
  ghostAdminApiKey?: string;
  ghostContentApiKey?: string;
  returnTo?: string;
  error?: string;
  success?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings - Ghost MCP</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Ghost Settings</h1>
    <p class="desc">Configure your Ghost site credentials for MCP access.</p>
    ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ''}
    ${params.success ? `<div class="success">${escapeHtml(params.success)}</div>` : ''}
    <form method="POST" action="/settings" id="settingsForm">
      ${params.returnTo ? `<input type="hidden" name="returnTo" value="${escapeHtml(params.returnTo)}" />` : ''}
      <label for="ghost_url">Ghost URL *</label>
      <input type="url" id="ghost_url" name="ghost_url" placeholder="https://your-site.ghost.io" value="${escapeHtml(params.ghostUrl ?? '')}" required />
      <p class="hint">Your Ghost site URL (e.g., https://example.ghost.io)</p>
      <label for="ghost_admin_api_key">Admin API Key</label>
      <input type="text" id="ghost_admin_api_key" name="ghost_admin_api_key" placeholder="${params.ghostAdminApiKey ? '********' : '64-character hex key'}" />
      <p class="hint">Found in Ghost Admin &rarr; Settings &rarr; Integrations. ${params.ghostAdminApiKey ? 'Leave blank to keep current value.' : ''}</p>
      <label for="ghost_content_api_key">Content API Key</label>
      <input type="text" id="ghost_content_api_key" name="ghost_content_api_key" placeholder="${params.ghostContentApiKey ? '********' : 'Content API key'}" />
      <p class="hint">Read-only access. At least one API key is required. ${params.ghostContentApiKey ? 'Leave blank to keep current value.' : ''}</p>
      <button type="submit">Save Settings</button>
    </form>
  </div>
  <script>
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
      var admin = document.getElementById('ghost_admin_api_key').value.trim();
      var content = document.getElementById('ghost_content_api_key').value.trim();
      var hasExisting = ${JSON.stringify(!!(params.ghostAdminApiKey || params.ghostContentApiKey))};
      if (!admin && !content && !hasExisting) {
        e.preventDefault();
        var errDiv = document.querySelector('.error');
        if (!errDiv) {
          errDiv = document.createElement('div');
          errDiv.className = 'error';
          document.querySelector('.desc').after(errDiv);
        }
        errDiv.textContent = 'Please provide at least one API key (Admin or Content).';
      }
    });
  </script>
</body>
</html>`;
}
