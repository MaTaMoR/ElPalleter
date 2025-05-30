import type { APIRoute } from 'astro';

export const post: APIRoute = async ({ request }) => {
  const { slug } = await request.json();
  if (!slug) {
    return new Response(
      JSON.stringify({ error: 'Falta el parámetro slug' }),
      { status: 400 }
    );
  }

  try {
    // Revalida la ruta raíz y la específica del slug
    await Astro.revalidate('/');
    await Astro.revalidate(`/${slug}`);
    return new Response(
      JSON.stringify({ revalidated: true }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};