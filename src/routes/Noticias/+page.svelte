<script lang="ts">
	import Header from "../components/Header.svelte";
	import TableNews from "../components/TableNews.svelte";


    let nombre = "Noticias y promociones";
</script>

<main>
    <div class="min-h-screen bg-gray-50 p-6">
        <Header {nombre} />
        <TableNews/>
    </div>
</main>