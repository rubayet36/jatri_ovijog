// Select the form
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = signupForm.name.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value.trim();
  const confirmPassword = signupForm.confirmPassword.value.trim();
  const termsChecked = signupForm.terms.checked;
  const accountTypeEl = signupForm.querySelector("input[name='accountType']:checked");

  // 1. Check required fields
  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill in all fields.");
    return;
  }

  // 2. Minimum password length (basic rule)
  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  // 3. Passwords must match
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  // 4. Terms must be accepted
  if (!termsChecked) {
    alert("You must agree to the Terms & Conditions.");
    return;
  }

  if (!accountTypeEl) {
    alert("Please select whether you are signing up as User or Police.");
    return;
  }

  // Submit to backend
  try {
    const resp = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role: accountTypeEl.value
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      alert(data.error || "Sign up failed.");
      return;
    }
    alert("Registration successful! You can now log in.");
    // Redirect to login page after successful sign up
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("An error occurred while signing up. Please try again.");
  }
});
