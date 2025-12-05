// Select the form
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", (event) => {
  const name = signupForm.name.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value.trim();
  const confirmPassword = signupForm.confirmPassword.value.trim();
  const termsChecked = signupForm.terms.checked;

  // 1. Check required fields
  if (!name || !email || !password || !confirmPassword) {
    event.preventDefault();
    alert("Please fill in all fields.");
    return;
  }

  // 2. Minimum password length (basic rule)
  if (password.length < 6) {
    event.preventDefault();
    alert("Password must be at least 6 characters long.");
    return;
  }

  // 3. Passwords must match
  if (password !== confirmPassword) {
    event.preventDefault();
    alert("Passwords do not match.");
    return;
  }

  // 4. Terms must be accepted
  if (!termsChecked) {
    event.preventDefault();
    alert("You must agree to the Terms & Conditions.");
    return;
  }

  // If you had a real backend, the form would now submit to /signup
  // For now we just let it submit naturally.
});
