<script>
	import { validauthtoken } from "../store";
	async function loginHandler() {
		console.log("Login!");
		const email = document.getElementById("login_email").value;
		const password = document.getElementById("login_password").value;

		console.log({ email, password });

		const r = await fetch("http://127.0.0.1:4444/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
			}),
		});
		const rjson = await r.json();

		console.log(rjson);
		if (rjson.logged_in) {
			console.log("Logged in");
			$validauthtoken = rjson.token;
			localStorage.setItem("auth-token", $validauthtoken);
			window.location.replace("/");
		}
	}
	async function signout() {
		localStorage.setItem("auth-token", "");
		$validauthtoken = "";
	}
</script>

<main>
	{#if !$validauthtoken}
		<h1>Login</h1>
		<form on:submit|preventDefault={loginHandler}>
			<input type="email" id="login_email" placeholder="email" />
			<input type="password" id="login_password" placeholder="password" />
			<input type="submit" />
		</form>
	{:else}
		<h1>You are logged in!</h1>
		<h4>Sign out here:</h4>
		<span on:click={signout} id="signout">Sign out</span>
	{/if}
</main>

<style>
	#signout {
		color: blue;
		text-decoration: underline;
		text-decoration-color: blue;
	}
</style>
