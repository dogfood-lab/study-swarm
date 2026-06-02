<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dogfood-lab/study-swarm"><img src="https://img.shields.io/npm/v/@dogfood-lab/study-swarm" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**Fundamentar las decisiones de diseño en investigaciones citadas, y luego verificar las citas con un *modelo diferente* antes de que se convierta en algo definitivo.**

`study-swarm` es un protocolo, no una herramienta. Cuando se toma una decisión de diseño importante con un LLM (un nuevo nivel de producto, una elección de arquitectura, una decisión sobre si se debe confiar en el modelo), improvisar a partir de principios básicos da como resultado diseños obsoletos, y citar artículos de memoria da como resultado diseños que se basan en fuentes que no existen o que no dicen lo que se cree. `study-swarm` reemplaza ambas opciones: se envían agentes de investigación en paralelo, se exige la presentación de hallazgos específicos y se verifica cada cita a través de un **verificador externo de una familia de modelos diferente** antes de que se utilice para informar el diseño.

Aplica su propia medicina. El protocolo prescribe el uso de verificadores para proteger los resultados de los sistemas que ayuda a diseñar, por lo que lo aplica también a sí mismo. **Ningún modelo califica su propio trabajo, incluido el que ejecuta el protocolo.**

## El protocolo en cinco pasos

1. **Identificar** de 3 a 5 preguntas de diseño clave en las que la evidencia empírica cambiaría la respuesta.
2. **Enviar** un agente de investigación por cada pregunta, en paralelo. Cada uno debe devolver títulos de artículos + autores + años + URL + un hallazgo de una sola frase; se prioriza la especificidad sobre la amplitud ("6-8 hallazgos bien documentados superan a 20 observaciones vagas").
3. **Sintetizar** los hallazgos en una sección de *fundamentación de la investigación*: `N. **<hallazgo>.** <Autores> <año> (<arXiv/DOI>). <implicación para el diseño>.`
4. **Verificar externamente** — una *familia de modelos diferente*, sin razonamiento, verifica cada cita en dos etapas: un **oráculo de recuperación** confirma que el artículo existe (nunca la memoria del modelo), y luego una lente de **fundamentación** confirma que el hallazgo coincide con la fuente. **Detener** si se detecta una falsificación o atribución incorrecta; **detener y escalar** si el verificador o el oráculo de recuperación no están disponibles (nunca interpretar la ausencia como "las citas son correctas").
5. **Conectar** cada elección de arquitectura con un hallazgo mediante un número. Las citas sin una implicación para el diseño son ruido.

Los detalles completos y ejecutables (la tabla de detención, el estándar de fuentes, la regla de conjunto) se encuentran en **[PROTOCOL.md](PROTOCOL.md)**.

## ¿Por qué una *familia diferente* y sin razonamiento?

Porque los modos de fallo están documentados, no son hipotéticos:

- **Los LLM no pueden verificar de manera confiable su propia salida.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — el verificador externo proporciona las ventajas; el contenido de autocrítica es inerte.
- **Los evaluadores de la misma familia se auto-favorecen.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — el auto-reconocimiento se correlaciona *linealmente* con la auto-preferencia, por lo que el cegamiento parcial no ayuda. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un panel de diferentes familias es menos sesgado a un costo aproximadamente 7 veces menor.
- **Las citas son donde los LLM mienten.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — el 55% de las citas de GPT-3.5 / 18% de las citas de GPT-4 son falsas. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — los enlaces resuelven más del 94% de las veces, pero solo el 39-77% del contenido citado realmente respalda la afirmación. Por lo tanto, la existencia debe verificarse mediante la **recuperación, no la memoria**.
- **Ocultar el razonamiento del generador.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — la manipulación del razonamiento en cadena infla los falsos positivos de un evaluador hasta en un 90% con acciones fijas. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — el razonamiento en cadena es una racionalización *a posteriori*. El verificador ve la afirmación de la cita sin adornos, nunca el "por qué la incluí".
- **La diversidad supera a la cantidad.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — cuatro verificadores con una correlación por pares de ρ ∈ [0.05, 0.25] superan a cualquiera de ellos mediante una cobertura submodular. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — los errores de los LLM están *correlacionados*, por lo que la variable clave es la diversidad de las lentes, no la cantidad.

## ¿Funciona realmente? (prueba)

Como prueba, el protocolo se ejecutó con sus propias citas. Dos familias no correlacionadas y diferentes a Claude — **Mistral** (`mistral-small:24b`) y **IBM Granite** (`granite4.1:30b`) — verificaron un conjunto de citas, sin razonamiento, con dos trampas ocultas:

| Trampa plantada | Mistral | IBM Granite | Verdad fundamental |
|---|---|---|---|
| El razonamiento en cadena atribuido a "Nakamura & Olsen" | no se detectó | **se detectó** (atribución incorrecta → en realidad Wei et al. 2022) | atribución incorrecta |
| un artículo fabricado con la afirmación de que "el 98% de los errores se eliminan, no se necesita un oráculo" | **caught** (fabricated) | **caught** (fabricated) | fabricado |

Ninguna de las dos familias detectó ambas trampas por sí sola, pero su **unión detectó 2/2**. Un solo evaluador habría aceptado la atribución incorrecta. Por separado, el oráculo de recuperación detectó dos *atribuciones incorrectas reales* en nuestros propios documentos de diseño (artículos citados con el primer autor incorrecto) que ningún LLM paramétrico podría haber detectado, y confirmó correctamente los artículos genuinos de 2026 que ambos LLM marcaron erróneamente como fabricados simplemente porque los artículos son posteriores a su entrenamiento. Ese último punto es la razón por la que la verificación de la existencia en el paso 4 **debe** ser un oráculo de recuperación, nunca un LLM.

Esa única ejecución es la tesis en miniatura: **lentes no correlacionadas + un oráculo de recuperación para la existencia superan a cualquier evaluador inteligente**.

## Cómo está conectado

Puede ejecutar el protocolo manualmente: cualquier modelo de una familia diferente más la resolución de arXiv/DOI por sí mismo satisface el paso 4. Dos herramientas complementarias lo convierten en un solo comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — el verificador en tiempo de ejecución: enrutamiento diferenciado por familia, sin razonamiento superfluo, adjudicación con múltiples lentes, un umbral determinista para la existencia de referencias (arXiv → Crossref) y comprobantes firmados.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — proporciona `roleos verify-citations <dispatch>`, el programa que extrae las citas de un documento y las valida a través de prism.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | Función |
|---|---|
| `study-swarm protocol` | Imprime el protocolo completo: los cinco pasos, la tabla de control y el estándar de búsqueda de fuentes. |
| `study-swarm new <slug>` | Crea un archivo `<slug>.dispatch.md` con la estructura de los cinco pasos para que se complete. |
| `study-swarm lint <file>` | Comprueba la *base de investigación* de un documento en relación con el estándar de búsqueda de fuentes; cada hallazgo debe tener un autor, un año y un identificador que se pueda resolver (arXiv / DOI / URL); se rechazan las afirmaciones vagas como "los estudios demuestran...". Si se detectan infracciones, el programa finaliza con el código `1`, lo que impide que se ejecute en el entorno de integración continua (CI). |

`lint` es determinista (no realiza llamadas al modelo), por lo que es seguro para usar en el entorno de integración continua (CI). Aplica el **estándar de búsqueda de fuentes del paso 3** a nivel local; la verificación basada en el modelo del **paso 4** sigue dependiendo de [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

## Por qué funciona, en pocas palabras

**Eficiencia:** el campo avanza rápidamente; exigir estudios específicos y exhaustivos retrasa el lanzamiento de los diseños en 18 meses. **Funcionalidad:** la evidencia muestra lo que *falla*, no solo lo que funciona (las explicaciones pueden aumentar la dependencia excesiva de una IA *incorrecta* — Bansal et al. 2021). **Seguridad:** el entorno protegido por el verificador es la arquitectura que respalda la evidencia, y el protocolo la aplica a su propia salida. La verificación no es un ejercicio académico; es el rastro de la evidencia.

## Seguridad

`study-swarm` es un repositorio de documentación: Markdown y un logotipo. No incluye código ejecutable ni instala nada de este repositorio. No accede a datos, no requiere permisos y no recopila datos de telemetría; no hay secretos ni credenciales en el código fuente. La metodología *describe* un flujo de trabajo que utiliza la recuperación web y la verificación basada en modelos, pero este repositorio no lo implementa ni lo ejecuta. Consulte [SECURITY.md](SECURITY.md).

## Estado

Un protocolo funcional, verificado externamente por su propio mecanismo: una familia de modelos diferente verifica sus citas (vea la prueba anterior). Este repositorio es la referencia pública; [PROTOCOL.md](PROTOCOL.md) es la implementación ejecutable. Forma parte de la familia [dogfood-lab](https://github.com/dogfood-lab): métodos y ejemplos para construir en la era de la IA.

Con licencia MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
