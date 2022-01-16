<script>
	import { Link } from "svelte-routing";
	import { validauthtoken, circles_data, uid, owned_point } from "../store";

	async function signout() {
		localStorage.setItem("auth-token", "");
		$validauthtoken = "";
		$circles_data = [];
		$uid = "";
		$owned_point = {};
	}
</script>

<nav id="navbar">
	<Link class="link" to="about">About</Link>
	<Link class="link" to="/"
		><img id="logo" src="/img/logo.png" alt="Kinesis Logo" /></Link
	>

	{#if $validauthtoken}
		<span class="link" on:click={signout}>Sign out</span>
	{:else}
		<Link class="link" to="login">Login</Link>
	{/if}
</nav>

<style>
	#navbar {
		width: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding-left: 30vw;
		padding-right: 30vw;
	}
	#logo {
		height: 25px;
	}
	#navbar .link {
		text-decoration: underline;
		cursor: pointer;
	}
	@media only screen and (max-width: 600px) {
		#navbar {
			justify-content: space-between;
			padding-left: 5vw;
			padding-right: 5vw;
		}
		#logo {
			margin-left: 10px;
		}
	}
</style>
