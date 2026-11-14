export async function adminResponse(response) {
  try {
    return await response.json();
  } catch {
    if (response.redirected || [401,403].includes(response.status))
      throw new Error("Sign in to the staff workspace again, then resume your saved work.");
    throw new Error("The server interrupted this request (HTTP " + response.status + "). Reopen the saved draft or catalogue and resume processing.");
  }
}
