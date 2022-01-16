<!-- App.svelte -->
<script>
	import { Router, Link, Route } from "svelte-routing";
	import Home from "./routes/Home.svelte";
	import About from "./routes/About.svelte";
	import Login from "./routes/Login.svelte";
	import { validauthtoken, circles_data, uid, owned_point } from "./store";
	import { onMount } from "svelte";
	export let url = "";

	window.BASE_URL = "https://kinesisbackend.herokuapp.com";
	window.dev = false;
	if (
		window.location.hostname == "localhost" ||
		window.location.hostname == "127.0.0.1"
	) {
		window.dev = true;
		window.BASE_URL = "http://127.0.0.1:4444";
	}
	console.log(window.BASE_URL);
	console.log("window.dev: ", window.dev);

	async function signout() {
		localStorage.setItem("auth-token", "");
		$validauthtoken = "";
		$circles_data = [];
		$uid = "";
		$owned_point = {};
	}
	onMount(async () => {
		const auth_token = localStorage.getItem("auth-token");
		if (auth_token) {
			console.log("cached auth token", auth_token);
			const r = await fetch(
				window.BASE_URL +
					"/api/auth/verify/" +
					encodeURIComponent(auth_token),
				{
					method: "GET",
				}
			);
			const rjson = await r.json();

			if (rjson.valid) {
				$uid = String(rjson.uid);
				$validauthtoken = auth_token;
				console.log("Login saved!!", rjson.uid);
			}
		}
	});
</script>

<Router {url}>
	<nav id="navbar">
		<Link class="link" to="/">Home</Link>
		<Link class="link" to="about">About</Link>
		{#if $validauthtoken}
			<span class="link" on:click={signout}>Sign out</span>
		{:else}
			<Link class="link" to="login">Login</Link>
		{/if}
	</nav>

	<div id="render">
		<Route path="about" component={About} />
		<Route path="login" component={Login} />
		<Route path="/"><Home /></Route>
	</div>
</Router>

<style>
	#render {
		width: 100%;
		height: 100%;
		margin: 0px;
		padding: 0px;
	}
	#navbar {
		width: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding-left: 30vw;
		padding-right: 30vw;
	}
	#navbar .link {
		text-decoration: underline;
		cursor: pointer;
	}
	@media only screen and (max-width: 600px) {
		#navbar {
			justify-content: space-between;
			padding-left: 10vw;
			padding-right: 10vw;
		}
	}
</style>
