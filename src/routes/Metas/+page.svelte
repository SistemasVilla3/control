<script lang="ts">
	import Header from "../components/Header.svelte";
	import TableMetas from "../components/TableMetas.svelte";


    let nombre = "Alta de metas";
</script>

<main>
    <div class="min-h-screen bg-gray-50 p-6">
        <Header {nombre} />
        <TableMetas/>
    </div>
</main>

<style></style>