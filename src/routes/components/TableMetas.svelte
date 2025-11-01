<script lang="ts">
	import { fetchMetasVend, fetchProgre, type Meta, type Progreso } from '../../lib/functions/Metas';
	import { fetchVendedores, type Vendedor } from '../../lib/functions/Vendedores';
	import { onMount, onDestroy } from 'svelte';
	import { formatNumber } from '$lib/functions/Multitask';
	import { fetchComVend, type ComVend } from '$lib/functions/Comisiones';
	import { fetchCar, type Cartera } from '$lib/functions/Cartera';
	const API_ACT_MET = 'http://192.168.10.134:8018/InsertMeta';

	let user: Vendedor[] = [];
	let loading = false;
	let error = '';
	let interval: ReturnType<typeof setInterval>;

	let monto: Record<number, Meta> = {};
	let prog: Record<number, Progreso> = {};
	let utils: Record<number, ComVend> = {};
	let wallet: Record<number, Cartera> = {};
	let totalCom: Record<number, number> = {};

	let admin = 'admin'; // Cambia esto al usuario actual si es necesario

	async function UpdateMeta(
		MontoDeMeta: number,
		Mes: number,
		Anio: number,
		UsuarioCreacion: string,
		VendedorID: number
	) {
		const data = {
			MontoDeMeta: MontoDeMeta,
			Mes: Mes,
			Anio: Anio,
			UsuarioCreacion: UsuarioCreacion,
			VendedorID: VendedorID
		};
		try {
			console.log('Datos a enviar:', data);
			const res = await fetch(API_ACT_MET, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (!res.ok) {
				const errorText = await res.text();
				console.error('Error en la respuesta del servidor:', errorText);
				throw new Error('Error al actualizar la meta');
			}
			const resData = await res.json();
			console.log('Meta actualizada:', resData);
			return true;
		} catch (error) {
			console.error('Error al actualizar la meta:', error);
			return false;
		}
	}

	async function loadVendedores() {
		loading = true;
    	error = '';
		
		try {
			user = await fetchVendedores();

			// Objetos provisionales
			const tmpMonto:  Record<number, Meta>      = {};
			const tmpProg:   Record<number, Progreso>  = {};
			const tmpUtils:  Record<number, ComVend>   = {};
			const tmpWallet: Record<number, Cartera>   = {};
			const tmpTotal: Record<number, number> = {};

			// Procesamos vendedores de uno en uno (4 peticiones en paralelo cada vez)
			for (const v of user) {
				const [metaRes, progRes, comRes, carRes] = await Promise.allSettled([
					fetchMetasVend(v.IdVendedor),
					fetchProgre(v.IdVendedor),
					fetchComVend(v.SapID),
					fetchCar(v.SapID)
				]);

				const meta    = metaRes.status  === 'fulfilled' ? metaRes.value  : null;
				const load    = progRes.status  === 'fulfilled' ? progRes.value  : null;
				const comVend = comRes.status   === 'fulfilled' ? comRes.value   : null;
				const cartera = carRes.status   === 'fulfilled' ? carRes.value   : null;

				// Sólo guardamos si llegó algo
				if (meta)    tmpMonto[v.IdVendedor]  = meta;
				if (load)    tmpProg[v.IdVendedor]   = load;
				if (comVend) tmpUtils[v.IdVendedor]  = comVend;
				if (cartera) tmpWallet[v.IdVendedor] = cartera;

				if (comVend && cartera) {
				const contado = comVend.ComisionContado ?? 0;
				const credito = comVend.ComisionCredito ?? 0;
				const pctVen  = cartera.PorcentajeCarteraVencida ?? 0;

				tmpTotal[v.IdVendedor] =
					pctVen >= 20
					? contado
					: contado + credito;
				}

				// DEBUG opcional
				console.log('Vendedor', v.IdVendedor, { meta, load, comVend, cartera, tmpTotal});
				console.log("TotalCom para:", v.IdVendedor, tmpTotal[v.IdVendedor]);
			}

			// Una sola reasignación por variable ⇒ Svelte se entera y re-renderiza
			monto   = tmpMonto;
			prog    = tmpProg;
			utils   = tmpUtils;
			wallet  = tmpWallet;
			totalCom = tmpTotal;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	async function handleMeta(button: HTMLButtonElement) {
		const row = button.closest('tr');
		if (!row) return;

		const input = row.querySelector('input[type="number"]') as HTMLInputElement;
		const metaNew = parseFloat(input?.value || '0');

		const vendedorId = Number(button.getAttribute('data-id'));
		const usuario = admin;
		const mes = new Date().getUTCMonth() + 1;
		const anio = new Date().getFullYear();

		if (metaNew && vendedorId) {
			console.log('Datos a enviar:', {
				MontoDeMeta: metaNew,
				Mes: mes,
				Anio: anio,
				UsuarioCreacion: usuario,
				IdVendedor: vendedorId
			});
			const success = await UpdateMeta(metaNew, mes, anio, usuario, vendedorId);
			if (success) {
				alert('Meta actualizada exitosamente');
				input.value = '';
				loadVendedores(); // Recargar los vendedores para actualizar la tabla
			} else {
				alert('Error al actualizar la meta');
			}
		} else {
			alert('Por favor, ingrese un monto válido.');
		}
	}

	onMount(() => {
		loadVendedores();
		interval = setInterval(() => {
			loadVendedores();
		}, 150_000);
	});
	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="m-5 rounded-lg border border-gray-200 bg-white shadow-sm">
	<div class="table-scroll max-h-[750px] overflow-y-auto rounded-md">
		<table class="w-full rounded-md">
			<thead>
				<tr class="sticky top-0 z-10 rounded-md bg-red-800">
					<th
						class="text-white-900 px-4 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Vendedor</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Meta actual</th
					>
					<th
						class="text-white-900 px-5 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Alcanzado</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>%Alcanzado</th
					>
					<th
						class="text-white-900 px-6 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Meta nueva</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Comision contado</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Comision credito</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Cartera vencida</th
					>
					<th
						class="text-white-900 px-3 py-3 text-center text-sm font-exo font-bold tracking-wider uppercase"
						>Comision total</th
					>
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#each user as us}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{us.Nombre}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if monto[us.IdVendedor]}
								{formatNumber(monto[us.IdVendedor]?.MontoDeMeta ?? 0)}
							{:else}
								<em>No hay meta establecida</em>
							{/if}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if monto[us.IdVendedor]}
								{#if prog[us.IdVendedor]?.MontoProgreso == 0}
									<em>No hay ventas registradas</em>
								{:else}
									{formatNumber(prog[us.IdVendedor]?.MontoProgreso ?? 0)}
								{/if}
							{:else}
								<em>No hay ventas registradas</em>
							{/if}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if monto[us.IdVendedor]}
								{(prog[us.IdVendedor]?.ProgresoPorcentual ?? 1).toFixed(2)}%
							{:else}
								<em>No hay datos de comisión</em>
							{/if}
						</td>
						<td class="p-1">
							<input
								class="m-1 w-40 items-end rounded-md text-gray-900"
								type="number"
								placeholder="Nueva meta"
							/>
							<button
								class="text-white-900 ml-8 items-center rounded-md bg-red-800 px-4 py-2 font-exo font-semibold hover:bg-red-700"
								on:click={(event) => handleMeta(event.currentTarget)}
								data-id={us.IdVendedor}
								data-actual={prog[us.IdVendedor]?.MontoProgreso ?? 0}>Guardar</button
							>
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if utils[us.IdVendedor]}
								${formatNumber(utils[us.IdVendedor]?.ComisionContado ?? 0)}
							{/if}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if utils[us.IdVendedor]}
								${formatNumber(utils[us.IdVendedor]?.ComisionCredito ?? 0)}
							{/if}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if wallet[us.IdVendedor]}
								{(wallet[us.IdVendedor]?.PorcentajeCarteraVencida ?? 0).toFixed(2)}%
							{:else}
								<em>-</em>
							{/if}
						</td>
						<td class="px-4 py-4 text-center font-exo font-semibold whitespace-nowrap text-gray-900">
							{#if totalCom[us.IdVendedor] !== undefined}
								${formatNumber(totalCom[us.IdVendedor])}
							{:else}
								<em>-</em>
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
		width: 8px; /* grosor */
	}
	.table-scroll::-webkit-scrollbar-track {
		background: #f3f4f6; /* gray-100 */
		border-radius: 4px;
	}
	.table-scroll::-webkit-scrollbar-thumb {
		background: #800000; /* blue-500 */
		border-radius: 4px;
		border: 0.5px solid #f3f4f6; /* margen “inset” */
	}
	.table-scroll:hover::-webkit-scrollbar-thumb {
		background: #bd1f19; /* blue-600 */
	}
</style>
