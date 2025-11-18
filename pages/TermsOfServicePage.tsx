







import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TermsOfServicePage = () => {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                // Using timeout to ensure the element is rendered before scrolling
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [hash]);

    const LegalSection = (props) => (
        React.createElement("div", { className: "mb-6", id: props.id },
            React.createElement("h2", { className: "text-2xl font-bold mb-3 pt-4" }, props.title),
            React.createElement("div", { className: "space-y-2 text-gray-700 dark:text-gray-300" }, props.children)
        )
    );

    return (
        React.createElement("div", { className: "max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md" },
            React.createElement("h1", { className: "text-4xl font-extrabold text-center mb-6" }, "Términos y Políticas"),
            React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400 text-center mb-8" }, "Última actualización: 1 de Enero de 2024"),
            
            React.createElement(LegalSection, { id: "terms", title: "1. Aceptación de los Términos", children: 
                React.createElement("p", null, "Bienvenido a Swapit. Al acceder o utilizar nuestra aplicación, usted acepta estar sujeto a estos Términos de Servicio y a nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de los términos, no podrá utilizar nuestros servicios.")
            }),

            React.createElement(LegalSection, { title: "2. Descripción del Servicio", children: 
                React.createElement("p", null, "Swapit proporciona una plataforma en línea que permite a los usuarios intercambiar artículos. No somos parte de ninguna transacción de intercambio. No tenemos control sobre la calidad, seguridad, moralidad o legalidad de cualquier aspecto de los artículos listados, la veracidad o exactitud de los listados, la capacidad de los usuarios para intercambiar artículos.")
            }),
            
            React.createElement(LegalSection, { title: "3. Cuentas de Usuario", children: 
                 React.createElement("p", null, "Para acceder a ciertas funciones de la aplicación, debe registrarse para obtener una cuenta. Al crear una cuenta, usted se compromete a proporcionar información precisa, actual y completa. Usted es responsable de salvaguardar su contraseña y de cualquier actividad o acción bajo su cuenta.")
            }),

            React.createElement(LegalSection, { title: "4. Contenido del Usuario", children: 
                React.createElement("p", null, "Usted es el único responsable de todo el contenido que publique. Al publicar contenido, usted otorga a Swapit una licencia mundial, no exclusiva, libre de regalías para usar, copiar, modificar, distribuir y mostrar dicho contenido en relación con el servicio.")
            }),

            React.createElement(LegalSection, { title: "5. Limitación de Responsabilidad", children: 
                 React.createElement("p", null, "En la máxima medida permitida por la ley aplicable, Swapit no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, o de cualquier pérdida de beneficios o ingresos, ya sea incurrida directa o indirectamente, o cualquier pérdida de datos, uso, buena voluntad u otras pérdidas intangibles, como resultado de su acceso o uso o incapacidad para acceder o usar el servicio.")
            }),
            
            React.createElement(LegalSection, { title: "6. Modificaciones a los Términos", children: 
                 React.createElement("p", null, "Nos reservamos el derecho de modificar estos términos en cualquier momento. Si realizamos cambios, se lo notificaremos publicando los términos revisados en la aplicación. Su uso continuado del servicio después de que los cambios entren en vigor constituirá su aceptación de los nuevos términos.")
            }),

            React.createElement(LegalSection, { id: "privacy", title: "7. Política de Privacidad", children: 
                React.createElement(React.Fragment, null,
                    React.createElement("p", null, "Esta política explica qué información recopilamos, cómo la usamos y compartimos, y cómo puede controlar su información."),
                    React.createElement("h3", { className: "text-lg font-semibold mt-4 mb-2" }, "Información que Recopilamos"),
                    React.createElement("ul", { className: "list-disc list-inside ml-4" },
                        React.createElement("li", null, React.createElement("strong", null, "Información que nos proporciona:"), " Recopilamos la información que comparte con nosotros, incluyendo su nombre, correo electrónico, número de teléfono, ubicación e intereses al registrarse y completar su perfil."),
                        React.createElement("li", null, React.createElement("strong", null, "Contenido:"), " Recopilamos el contenido que publica en la app, como fotos y descripciones de artículos, mensajes de chat y valoraciones."),
                        React.createElement("li", null, React.createElement("strong", null, "Datos de uso:"), " Recopilamos información sobre cómo interactúa con nuestro servicio.")
                    ),
                    React.createElement("h3", { className: "text-lg font-semibold mt-4 mb-2" }, "Cómo Usamos su Información"),
                    React.createElement("ul", { className: "list-disc list-inside ml-4" },
                        React.createElement("li", null, "Para proporcionar y mantener nuestro servicio."),
                        React.createElement("li", null, "Para notificarle sobre cambios en nuestro servicio."),
                        React.createElement("li", null, "Para permitirle participar en funciones interactivas."),
                        React.createElement("li", null, "Para proporcionar soporte al cliente."),
                        React.createElement("li", null, "Para recopilar análisis o información valiosa para que podamos mejorar nuestro servicio.")
                    )
                )
            })
        )
    );
};

export default TermsOfServicePage;