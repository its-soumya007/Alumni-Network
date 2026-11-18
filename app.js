// Initialize Supabase
const SUPABASE_URL = 'https://nklrpamkpcmrdyeqnjic.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jbRlcZEhvMcvOnSGOWrzyw_emTnaE9w';

// FIX: Renamed from 'supabase' to 'supabaseClient' to prevent conflicts
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI Toggle Logic
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

// Registration Logic
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const role = document.getElementById('reg-role').value;
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // 1. Check if username is already taken (Updated to supabaseClient)
    const { data: existingUser, error: checkError } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    if (existingUser) {
        alert("Username is already taken. Please choose another one.");
        return;
    }

    // 2. Sign up the user via Supabase Auth (Updated to supabaseClient)
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) {
        alert("Error signing up: " + authError.message);
        return;
    }

    // 3. Insert additional data into the profiles table (Updated to supabaseClient)
    if (authData.user) {
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert([
                { 
                    id: authData.user.id, 
                    role: role, 
                    full_name: name, 
                    username: username, 
                    email: email 
                }
            ]);

        if (profileError) {
            alert("Error saving profile details: " + profileError.message);
        } else {
            alert("Registration successful! You can now log in.");
            document.getElementById('register-form').reset();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        }
    }
});

// Login Logic
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get the value and remove any accidental spaces
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    
    let loginEmail = identifier;

    // Check if the user entered a username instead of an email (no '@' symbol)
    if (!identifier.includes('@')) {
        // Look up the email associated with this username in the profiles table
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .single();

        // If no user is found with that username, stop the login
        if (error || !data) {
            alert("Username not found. Please try again or register.");
            return;
        }

        // Set the login email to the email we just retrieved from the database
        loginEmail = data.email;
    }

    // Attempt to log in via Supabase Auth using the resolved email
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password: password,
    });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        // Redirect to dashboard page here
        window.location.href = 'dashboard.html';
    }
});