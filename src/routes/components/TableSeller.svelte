<script lang="ts">
	import { fetchMetasVend, fetchProgre, type Progreso, type Meta } from "../../lib/functions/Metas";
	import { fetchVendedores, type Vendedor } from "../../lib/functions/Vendedores";
	import { onMount, onDestroy } from "svelte";
    import { formatNumber } from "$lib/functions/Multitask";

    
    let seller: Vendedor[] = [];
    let loading = false;
    let error = "";
    let monto = new Map<number, Meta>();
    let prog = new Map<number, Progreso>();
    let interval: ReturnType<typeof setInterval>;

    async function loadSellers() {
        loading = true;
        error = "";
        try {
            seller = await fetchVendedores();

            const tmpMonto = new Map<number, Meta>();
			const tmpProg  = new Map<number, Progreso>();

			for (const v of seller) {
				const [metaRes, progRes] = await Promise.allSettled([
					fetchMetasVend(v.IdVendedor),
					fetchProgre(v.IdVendedor)
				]);

				if (metaRes.status === 'fulfilled' && metaRes.value)
					tmpMonto.set(v.IdVendedor, metaRes.value);

				if (progRes.status === 'fulfilled' && progRes.value)
					tmpProg.set(v.IdVendedor, progRes.value);
            }
            monto = tmpMonto;
            prog = tmpProg;
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
        monto = new Map(monto);
        prog = new Map(prog);
    }

    onMount(() => {
        loadSellers();
        interval = setInterval(() => {loadSellers(); }, 150_000);
    });
    onDestroy(() => {clearInterval(interval);})
</script>

<div class="space-y-2">
    <div class="max-h-[600px] table-scroll overflow-y-auto">
        <table class="w-full border-collapse">
        <thead>
            <tr class="border-b border-gray-200 text-gray-900 text-sm">
                <th class="py-2 px-4 font-exo font-black text-xl text-left">Nombre</th>
                <th class="py-2 px-4 font-exo font-black text-xl text-center">Meta establecida</th>
                <th class="py-2 px-4 font-exo font-black text-xl text-right">Total alcanzado</th>
            </tr>
        </thead>

        <tbody>
            {#each seller as sell}
                <tr>
                    <td class="py-2 px-4 text-lg text-left font-exo font-semibold text-gray-900">{sell.Nombre}</td>
                    <td class="py-2 px-4 text-lg text-center font-exo font-semibold text-gray-900">
                        {#if monto.has(sell.IdVendedor)}
                            {formatNumber(monto.get(sell.IdVendedor)?.MontoDeMeta ?? 0)}
                        {:else}
                            <em>No hay meta establecida</em>
                        {/if}
                    </td>
                    <td class="py-2 px-4 text-lg text-right font-exo font-semibold text-gray-900">
                        {#if prog.has(sell.IdVendedor)}
                            {#if prog.get(sell.IdVendedor)?.MontoProgreso == 0}
                                <em>No hay ventas registradas</em>
                            {:else}
                                {formatNumber(prog.get(sell.IdVendedor)?.MontoProgreso ?? 0)}
                            {/if}
                        {:else}
                            <em>No hay ventas registradas</em>
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    </div>
</div>

<style>
    .table-scroll::-webkit-scrollbar {
  width: 8px;                  /* grosor */
}
.table-scroll::-webkit-scrollbar-track {
  background: #f3f4f6;         /* gray-100 */
  border-radius: 4px;
}
.table-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6;         /* blue-500 */
  border-radius: 4px;
  border: .5px solid #f3f4f6;   /* margen “inset” */
}
.table-scroll:hover::-webkit-scrollbar-thumb {
  background: #2563eb;         /* blue-600 */
}
</style>