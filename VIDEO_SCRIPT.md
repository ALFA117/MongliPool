# MongliPool — Guion de Video Demo

**Duración objetivo:** 2–3 minutos
**Tono:** Accesible para jueces que no son expertos en ZK. Técnico solo cuando suma.

---

## ESCENA 1 — El problema (0:00 – 0:25)

**Visual:** Pantalla dividida: a la izquierda un explorador de blockchain mostrando una transacción con origen y destino visibles. A la derecha, texto destacado.

**Narración:**
> "En una blockchain pública, cada transacción es visible para todos. Si alguien conoce tu dirección, puede ver exactamente cuánto tienes y a quién le pagas. Esto es un problema para la privacidad financiera.
>
> Pero la solución obvia — ocultar todo — crea otro problema: el lavado de dinero. ¿Cómo logras privacidad sin perder la posibilidad de auditoría?"

---

## ESCENA 2 — La solución: MongliPool (0:25 – 0:55)

**Visual:** Landing page de MongliPool, scroll lento hacia abajo.

**Narración:**
> "MongliPool es un pool de privacidad en Stellar. Funciona como una caja fuerte comunal: depositas fondos por una puerta, y los retiras por otra. Nadie puede conectar las dos puertas.
>
> ¿Cómo? Con pruebas de conocimiento cero — matemática que demuestra que tienes derecho a retirar, sin revelar cuál depósito es tuyo.
>
> Y para el cumplimiento regulatorio, MongliPool tiene un ASP: una lista blanca de direcciones autorizadas por la DAO, y un auditor con una view key que puede ver los detalles de cada depósito si la ley lo requiere."

---

## ESCENA 3 — Demo: Depositar (0:55 – 1:25)

**Visual:** Browser con Freighter conectado. Navegar a `/depositar`.

**Pasos en pantalla:**
1. Click "Conectar Freighter" → se muestra la dirección
2. Click "Depositar 10 XLM" → spinner mientras genera el commitment
3. Aparece "¡Depósito exitoso!" con el recibo privado
4. Click "Descargar recibo"

**Narración:**
> "Vamos a depositar. Conecto mi wallet Freighter, y deposito 10 XLM — el monto fijo del pool.
>
> El browser acaba de generar dos números secretos, calcular un hash Poseidon con ellos, y enviar ese hash al contrato en Stellar. Los secretos nunca salieron de mi dispositivo.
>
> Este recibo es la única forma de retirar mis fondos. Si lo pierdo, los fondos quedan en el pool para siempre."

---

## ESCENA 4 — Demo: Retirar (1:25 – 2:10)

**Visual:** Browser en `/retirar`. Pegar el recibo.

**Pasos en pantalla:**
1. Pegar el recibo en el campo de texto
2. Ingresar dirección de retiro (puede ser diferente a la de depósito)
3. Click "Generar prueba y retirar"
4. Barra de progreso: "Generando prueba ZK..." (~30 segundos)
5. Aprobación de Freighter
6. Mensaje de éxito

**Narración:**
> "Ahora retiro. Pego mi recibo y uso una dirección de destino diferente — esa es la gracia, no hay link entre las dos.
>
> El browser está generando una prueba Groth16 ahora mismo — demuestra que conozco el secreto de algún depósito en el árbol de Merkle, que mi dirección está en la lista blanca del ASP, y que no estoy intentando un doble gasto. Todo esto sin revelar cuál depósito es el mío.
>
> La prueba se envía al contrato, que la verifica con pairing de curvas elípticas BN254 directamente en Soroban. Si pasa... los fondos llegan a mi nueva dirección."

---

## ESCENA 5 — Transparencia: lo que es MVP (2:10 – 2:35)

**Visual:** Mostrar la sección "Qué es real vs. MVP" del README, o slide dedicado.

**Narración:**
> "Siendo honestos: esto es un prototipo. La ceremonia de setup ZK es local — no hubo ceremonia pública MPC. La view key del auditor es una constante simétrica en el código — cualquiera puede leer las notas. Y el árbol del ASP es idéntico al del pool.
>
> Pero lo que sí es real: la prueba ZK se genera en el browser, se verifica on-chain con BN254, el doble gasto está bloqueado, y hay 18 tests pasando. Todo el flujo corre end-to-end en testnet."

---

## ESCENA 6 — Cierre (2:35 – 2:50)

**Visual:** Volver al landing page. Mostrar URL y logo de Mongli DAO.

**Narración:**
> "MongliPool: privacidad real en Stellar, con cumplimiento regulatorio incorporado. Construido por Mongli DAO para Stellar Hacks ZK.
>
> Pruébalo en frontend-ebon-xi-57.vercel.app, o revisa el código en GitHub. Gracias."

---

## Notas de producción

- **Grabación:** OBS Studio o Loom. Resolución 1920x1080.
- **Audio:** Grabar narración por separado (limpio) y sincronizar. Micrófono con pop filter.
- **Tip de timing:** La generación de prueba toma ~30 segundos reales. Mostrar los primeros 5 segundos del spinner, luego cortar a "30 segundos después..." para mantener ritmo.
- **Subtítulos:** Activar subtítulos en español e inglés si la plataforma lo permite.
- **Música:** Opcional, solo fondo muy suave tipo lo-fi. No cubrir la narración.