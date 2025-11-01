<script context="module" lang="ts">
    export const ssr=false; // Deshabilitar SSR para este componente
</script>

<script lang="ts">
  import Siema from 'siema';
  import { onMount, onDestroy, tick } from 'svelte';
  import { fetchNoticias, type Noticia } from '$lib/functions/Noticias';

  interface ImageItem {
    src: string;
    alt: string;
  }

  let data: ImageItem[] = [];

  let slider: Siema | null = null;            // instancia Siema
  let interVal: number | null = null;          // referencia al setInterval para autoplay
  let select = 0;        // índice del slide activo (para los bullets)
  let prevSlide: () => void = () => {};
  let nextSlide: () => void = () => {}; // funciones para botones manuales
  let prevCount = 0;     // para detectar cambios en data.length

  const vigencia = 30;

  async function loadImages() {
    try {
      const noticias = await fetchNoticias();
      console.log("Info:", noticias);

      data = noticias.map((n: Noticia): ImageItem => {

        let src: string = '';
        if (n.ImagenBase64) {
          src = `data:image/jpeg;base64,${n.ImagenBase64}`;
        } 

        return {
          src,
          alt: n.Titulo
        };
      });
      console.log('Imágenes cargadas:', data);
    } catch (err) {
      console.error('Error al cargar las imágenes:', err);
    }
  }

  $: hoy = new Date();
  $: validImages = data;

  async function initSiema() {
    if (validImages.length === 0) {
        select = 0;
        return;
    }
    if (slider) {
        slider.destroy();
        slider = null;
    }
    await tick();

    slider = new Siema({
        selector: '.siema',
        duration: 500,
        easing: 'ease-out',
        perPage: 1,
        startIndex: 0,
        draggable: true,
        multipleDrag: true,
        threshold: 20,
        loop: true,
        rtl: false,
        onInit: function() {},
        onChange: () => {
        select = slider!.currentSlide;
        }
    });
    console.log('Siema inicializado con imágenes válidas:', validImages);

    prevSlide = () => {
        slider && slider.prev();
    };
    nextSlide = () => {
        slider && slider.next();
    };
  }

  // 4. Al montarse el componente: 
  //    - Inicializamos Siema con el arreglo filtrado (validImages).
  //    - Creamos el setInterval de autoplay cada 3 segundos.
  //    - Guardamos prevCount = validImages.length
  onMount(async () => {
    await loadImages();
    await initSiema();

    if (validImages.length > 1) {
        interVal = window.setInterval(() => {
            slider && nextSlide();
        }, 3000);
    }

    prevCount = validImages.length;
  });

  // 5. Si el componente se destruye, limpiamos el intervalo y destruimos Siema
  onDestroy(() => {
    slider?.destroy();
    if (interVal) clearInterval(interVal);
  });
</script>

<!-- --------------
     7. MARKUP: Solo iteramos en validImages (no en data).
     -------------- -->
<div class="space-y-4">
    <div class="relative rounded-lg overflow-hidden font-exo">
      <div class="siema">
        {#if validImages.length === 0}
          <div class="slider">
            <p>Cargando imagenes...</p>
          </div>
          {:else}
          {#each validImages as image, i (i)}
            <div class="slide">
            <img src={image.src} alt={image.alt} />
            </div>
          {/each}
        {/if}
      </div>

      <!-- Bullets: uno por cada imagen válida -->
      <div class="flex justify-center space-x-2">
        {#each validImages as _, i}
          <input
          type="radio"
          class="h-2.5 w2.5 rounded-full bg-gray-300 checked:bg-gray-600 cursor-pointer"
          id={"r" + i}
          name="slider-radio"
          value={i}
          checked={select === i}
          on:click={() => slider && slider.goTo(i)}
          />
        {/each}
      </div>

      <div class="flex justify-between">
        <!-- Botones manuales -->
        {#if validImages.length > 1}
          <button on:click={prevSlide}>Previa</button>
          <button on:click={nextSlide}>Siguiente</button>
        {/if}
      </div>
    </div>
</div>

<style>
  .siema {
    overflow: hidden;
  }

  /* Cada slide centra la imagen o el mensaje de "sin imágenes" */
  .slide {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 500px; /* ajustar según convenga */
    padding: 4px;
  }
  .slide img {
    width: 500px;
    height: 475px;
    border-radius: 0.5rem;
    display: block;
  }
  input[type="radio"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border-radius: 50%;
    width: 10px;
    height: 10px;
    background-color: lightgrey;
    transition: 0.2s all linear;
    margin-right: 8px;
    cursor: pointer;
  }
  input[type="radio"]:checked {
    background-color: grey;
  }
  button {
    border: none;
    background-color: #1f2937;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    padding: .5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    justify-content: center;
  }
  button:hover {
    background-color: #374151;
  }
</style>