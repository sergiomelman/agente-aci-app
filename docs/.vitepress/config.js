export default {
  title: 'Agente ACI App',
  description: 'Documentação do Projeto Agente ACI.',
  base: '/agente-aci-app/', // Se for implantar em um subdiretório do GitHub Pages

  themeConfig: {
    // Logo que pode aparecer no topo
    // logo: '/vite.svg',

    // Navegação principal
    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia', link: '/guide' }
    ],

    // Barra lateral
    sidebar: [
      { text: 'Guia de Uso', link: '/guide' }
    ]
  }
}
