





import React from 'react';

const CookiePolicyPage = () => {
    const PolicySection = (props) => (
        React.createElement("div", { className: "mb-6" },
            React.createElement("h2", { className: "text-2xl font-bold mb-3" }, props.title),
            React.createElement("div", { className: "space-y-2 text-gray-700 dark:text-gray-300" }, props.children)
        )
    );

    return (
        React.createElement("div", { className: "max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md" },
            React.createElement("h1", { className: "text-4xl font-extrabold text-center mb-6" }, "Política de Cookies"),
            React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center mb-8" }, "Última actualización: 1 de Enero de 2024"),
            
            React.createElement(PolicySection, { title: "¿Qué son las cookies?", children: 
                React.createElement("p", null, "Las cookies son pequeños archivos de texto que se almacenan en su navegador cuando visita un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.")
            }),

            React.createElement(PolicySection, { title: "¿Cómo utilizamos las cookies?", children: 
                React.createElement("div", null,
                    React.createElement("p", null, "Utilizamos cookies para varios propósitos:"),
                    React.createElement("ul", { className: "list-disc list-inside ml-4" },
                        React.createElement("li", null, React.createElement("strong", null, "Cookies Esenciales:"), " Estas son necesarias para el funcionamiento de la aplicación, como mantener su sesión iniciada."),
                        React.createElement("li", null, React.createElement("strong", null, "Cookies de Preferencias:"), " Nos permiten recordar sus preferencias y configuraciones, como el tema de color."),
                        React.createElement("li", null, React.createElement("strong", null, "Cookies de Rendimiento y Análisis:"), " Nos ayudan a entender cómo interactúan los visitantes con nuestra aplicación, recopilando y reportando información de forma anónima."),
                        React.createElement("li", null, React.createElement("strong", null, "Cookies de Marketing:"), " (Si aplica) Se utilizan para rastrear a los visitantes a través de los sitios web. La intención es mostrar anuncios que sean relevantes y atractivos para el usuario individual.")
                    )
                )
            }),
            
            React.createElement(PolicySection, { title: "Sus Opciones", children: 
                 React.createElement("p", null, "Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies que ya están en su ordenador y puede configurar la mayoría de los navegadores para evitar que se coloquen. Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y que algunos servicios y funcionalidades no funcionen.")
            }),

            React.createElement(PolicySection, { title: "Cambios en esta Política", children: 
                React.createElement("p", null, "Podemos actualizar nuestra Política de Cookies de vez en cuando. Le notificaremos de cualquier cambio publicando la nueva Política de Cookies en esta página. Se le aconseja que revise esta Política de Cookies periódicamente para cualquier cambio.")
            })
        )
    );
};

export default CookiePolicyPage;