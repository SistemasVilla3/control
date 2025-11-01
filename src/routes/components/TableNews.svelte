<script lang="ts">
	import Carousel from "../components/Carousel.svelte";
	import ModImg from './ModImg.svelte';
    import { empleado, jwtToken } from '$lib/functions/AuthStore';
	import { onMount } from "svelte";

    const POST_NEWS = 'http://192.168.10.134:8018/noticiasNuevas';
    
    let submitting = false;
    let message: string | null = null;

    let titulo= '';
    let descripcion = '';
    let fechaPublicacion = '';
    let imgFile: File | null = null;
    let usuarioCreacion: string = '';

    $: usuarioCreacion = $empleado ?? '';

    function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            imgFile = input.files[0];
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!imgFile) {
            message = 'Por favor, selecciona una imagen.';
            return;
        }
        console.log('Fecha y hora de publicación:', fechaPublicacion);

        submitting = true;
        
        const formData = new FormData();
        formData.append('Titulo', titulo);
        formData.append('Descripcion', descripcion);
        formData.append('FechaPub', fechaPublicacion);
        formData.append('UsuarioCreo', usuarioCreacion);
        formData.append('imagen', imgFile);
        
        for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`Field: ${key}`, {
                    filename: value.name,
                    size:     value.size,
                    type:     value.type
                    });
                } else {
                    console.log(`Field: ${key}`, value);
                }
            }
        try{
            
            const res = await fetch(POST_NEWS, {
                method: 'POST',
                body: formData
            });

            const body = await res.json();

            if (!res.ok) {
                console.error('Error al enviar la noticia:', body);
                message = body.message;
                return;
            }
            console.log('Noticia enviada exitosamente:', body);
            alert("Noticia enviada correctamente");
            window.location.reload();
            } catch (err) {
            console.error('Error al enviar la noticia:', err);
            message = 'Error de red al enviar la noticia';
        } finally {
            submitting = false;
        }
    }

    onMount(() => {
        jwtToken.syncFromUrl();
        usuarioCreacion = $empleado ?? '';
    });
</script>

<div class="m-5 grid grid-cols-1 sm: grid-cols-3 gap-4">
    <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
            <h1 class="text-2xl font-semibold text-center text-gray-900">Nueva promoción</h1>
        </header>
        <form on:submit|preventDefault={handleSubmit} class="justify-between gap-2 p-2">
        <label class="text-center text-lg text-black-900">
            Título:<br>
            <input class="rounded-md"
            type="text" 
            bind:value={titulo} required />
        </label>
        <label class="text-center text-lg text-black-900">
            Descripción:<br>
            <textarea 
            class="rounded-md"
            bind:value={descripcion} required></textarea>
        </label>
        <label class="text-center text-lg text-black-900">
            Fecha de Publicación:<br>
            <input 
            class="rounded-md"
            type="date" 
            bind:value={fechaPublicacion} required />
        </label>
        <label class="text-center text-lg text-black-900">
            Usuario de Creación:<br>
            <input 
            class="rounded-md text-center"
            type="text" 
            value={usuarioCreacion} readonly />
        </label>
        <label class="text-center text-lg text-black-900">
            Imagen: <br>
            <input 
            class=" rounded-md border border-gray-500 p-3"
            type="file" accept="image/*"
            on:change={handleFileChange} required/>
        </label>
        <button 
        class="ml-40 items-center w-50 px-4 py-2 border border-gray-300 text-s rounded-md text-white-900 bg-red-800 hover:bg-red-700 disabled:opacity-50"
        type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Subir noticia'}
        </button>
    </form>
    </div>

    <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
            <h1 class="text-2xl font-semibold text-center text-gray-900">Actualizar promoción</h1>
        </header>
        <div class="p-4 lg:p-6">
            <ModImg/>
        </div>
    </div>

    <!--PROMOCIONES-->
    <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
            <h1 class="text-2xl font-semibold text-center text-gray-900">Promociones activas</h1>
        </header>
        <div class="p-4 lg:p-6">
            <Carousel />
        </div>
    </div>
</div>

<style>

    form {
        display: flex;
        flex-direction: column;
    }
</style>