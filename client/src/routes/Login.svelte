<script>
	import { Link } from "svelte-routing";

	import { validauthtoken } from "../store";

	async function loginHandler() {
		if (document.getElementById("error"))
			// immediately remove any error messages from previous attempts
			document.getElementById("error").remove();

		console.log("Login!");
		const email = document.getElementById("login_email").value;
		const password = document.getElementById("login_password").value;

		console.log({ email, password });
		const r = await fetch(window.BASE_URL + "/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
			}),
		});
		console.log(r.status);
		const rjson = await r.json();

		console.log(rjson);
		if (rjson.logged_in) {
			console.log("Logged in");
			$validauthtoken = rjson.token;
			localStorage.setItem("auth-token", $validauthtoken);
			window.location.replace("/");
		} else {
			if (r.status > 400) {
				let err_msg = document.createElement("p");
				err_msg.style.color = "#FF2929";
				err_msg.innerHTML = `Error ${r.status}: ${rjson.message}`;
				err_msg.id = "error";
				document.getElementsByTagName("main")[0].appendChild(err_msg);
			}
		}
	}
	async function signout() {
		localStorage.setItem("auth-token", "");
		$validauthtoken = "";
	}
</script>

<main id="login">
	{#if !$validauthtoken}
		<h2 class="title">Login</h2>
		<h3 id="register_refer">
			<Link to="register"
				>Don't have an account? Register for one here.</Link
			>
		</h3>
		<form id="login_form" on:submit|preventDefault={loginHandler}>
			<input
				class="text_input"
				type="email"
				id="login_email"
				placeholder="Email"
				requried
				name="email"
				autocomplete="off"
			/>
			<input
				class="text_input"
				type="password"
				id="login_password"
				placeholder="Password"
				required
				name="password"
				autocomplete="off"
			/>

			<input type="submit" id="submit" value="Log in" />
		</form>
	{:else}
		<h1>You are logged in!</h1>
		<h4>Sign out here:</h4>
		<span on:click={signout} id="signout">Sign out</span>
	{/if}
</main>

<style>
	#login {
		text-align: center;
	}

	#login_form {
		display: flex;
		flex-direction: column;
		margin: auto;
		align-items: center;
		width: 100%;
		position: relative;

		/* padding: 25px; */
	}

	#submit {
		width: 70px;
		font-size: 18px;
		background-color: white;
		color: black;
		border: 1px solid black;
		border-radius: 5px;
		padding: 5px;
	}
	.text_input {
		font-size: 18px;
		border: 1px solid black;
		background-color: white;
		border-radius: 5px;
		margin: 5px;
		padding: 8px;
	}
</style>
