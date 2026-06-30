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

**Fundamenten las decisiones de diseño en investigaciones citadas; luego, verifique las citas con un *modelo diferente* antes de que se convierta en algo definitivo.**

`study-swarm` es un protocolo, no una herramienta. Cuando toma una decisión de diseño importante con un LLM (un nuevo nivel de producto, una elección arquitectónica, una pregunta sobre si debemos confiar en el modelo), improvisar a partir de principios básicos da como resultado diseños obsoletos y citar artículos de memoria da como resultado diseños que se basan en fuentes que no existen o que no dicen lo que cree. `study-swarm` reemplaza ambas opciones: despliega agentes de investigación en paralelo, exige hallazgos específicos citados y valida cada cita a través de un **verificador externo de una familia de modelos diferente** antes de que influya en el diseño.

Aplica su propia medicina. El protocolo prescribe envoltorios protegidos por verificadores para los sistemas que ayuda a diseñar, por lo que ejecuta uno sobre sí mismo. **Ningún modelo califica su propio trabajo, incluido el que ejecuta el protocolo.**

## El protocolo en cinco pasos:

1. **Identifique** de 3 a 5 preguntas de diseño clave donde la evidencia empírica cambiaría la respuesta.
2. **Despliegue** un agente de investigación por pregunta, en paralelo. Cada uno debe devolver títulos de artículos + autores + años + URL + un hallazgo de una sola oración; priorice la especificidad sobre la amplitud ("6 a 8 hallazgos bien documentados superan a 20 observaciones vagas").
3. **Sintetice** los hallazgos en una sección de *fundamentación basada en investigaciones*: `N. **<hallazgo>.** <Autores> <año> (<arXiv/DOI>). <implicación para el diseño>.`
4. **Verifique externamente**: una *familia de modelos diferente*, sin razonamiento, verifica cada cita en dos etapas: un **oráculo de recuperación** confirma que el artículo existe (nunca la memoria del modelo), y luego una lente de **fundamentación** confirma que el hallazgo coincide con la fuente. **Deténgase** si se detecta una falsificación o atribución incorrecta; **deténgase y escale** si el verificador o el oráculo de recuperación no están disponibles (nunca interprete la ausencia como "las citas son correctas").
5. **Conecte** cada elección arquitectónica con un hallazgo mediante un número. Las citas sin una implicación para el diseño son ruido.

Los detalles completos y ejecutables: la tabla de detención, el estándar de fuentes y la regla del conjunto se encuentran en **[PROTOCOL.md](PROTOCOL.md)**.

## ¿Por qué una *familia diferente*, sin razonamiento?

Porque los modos de falla están documentados, no son hipotéticos:

- **Los LLM no pueden verificar de manera confiable su propia salida.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — el verificador externo proporciona las ventajas; el contenido de autocrítica es inerte.
- **Los evaluadores de la misma familia se auto-favorecen.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — el autorreconocimiento se correlaciona *linealmente* con la autopreferencia, por lo que el cegamiento parcial no ayuda. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — un panel de familias disjuntas es menos sesgado a un costo aproximadamente 7 veces menor.
- **Las citas son donde los LLM mienten.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — el 55% de las citas de GPT-3.5 / 18% de las citas de GPT-4 son falsas. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — los enlaces resuelven más del 94% de las veces, pero solo el 39-77% del contenido citado realmente respalda la afirmación. Por lo tanto, la existencia debe verificarse mediante la **recuperación, no la memoria**.
- **Oculte el razonamiento del generador.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — manipular solo la cadena de pensamiento infla los falsos positivos de un evaluador hasta en un 90% con acciones fijas. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoT es una racionalización *a posteriori*. El verificador ve la afirmación de cita sin adornos, nunca el "por qué lo incluí".
- **La diversidad supera a la cantidad.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — cuatro verificadores con una correlación por pares ρ ∈ [0.05, 0.25] superan a cualquiera de ellos mediante una cobertura submodular. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — los errores de los LLM están *correlacionados*, por lo que la variable clave es la diversidad de las lentes, no la cantidad bruta.

## ¿Realmente funciona? (prueba)

Como prueba, el protocolo se ejecutó con sus propias citas. Dos familias decorrelacionadas y distintas a Claude: **Mistral** (`mistral-small:24b`) e **IBM Granite** (`granite4.1:30b`), verificaron un conjunto de citas sin razonamiento, con dos trampas ocultas:

| Trampa plantada | Mistral | IBM Granite | Verdad fundamental |
|---|---|---|---|
| El razonamiento de la cadena de pensamiento se atribuyó a "Nakamura & Olsen" | no detectada | **detectada** (atribución incorrecta → en realidad Wei et al. 2022, arXiv:2201.11903) | atribución incorrecta |
| un artículo fabricado con la afirmación de que "el 98% de los errores se eliminan, no se necesita un oráculo" | **caught** (fabricated) | **caught** (fabricated) | fabricado |

Ninguna de las dos familias detectó ambas trampas por sí sola, pero su **unión detectó 2/2**. Un solo evaluador habría aceptado la atribución incorrecta. Por separado, el oráculo de recuperación detectó dos *atribuciones incorrectas reales* en nuestros propios documentos de diseño (artículos citados bajo el primer autor incorrecto) que ningún LLM paramétrico podría haber señalado, y confirmó correctamente los artículos genuinos de 2026 que ambos LLM marcaron erróneamente como fabricados simplemente porque los artículos son posteriores a su entrenamiento. Ese último punto es la razón por la cual la verificación de existencia en el paso 4 **debe** ser un oráculo de recuperación, nunca un LLM.

Esa única ejecución es la tesis en miniatura: **lentes decorrelacionadas + un oráculo de recuperación para la existencia superan a cualquier evaluador inteligente**.

### …y nuevamente, para diseñar v1.1

Las mejoras de la versión 1.1 se eligieron de la misma manera: ejecutando `study-swarm` sobre sí mismo (`study-swarm`). Cuatro preguntas que quedaron pendientes en la primera versión ("creo que...") (cómo *mecanizar* la verificación de la fundamentación, si se debe realizar la búsqueda en el momento de la generación, cómo *combinar* las diferentes perspectivas, si se debe abstenerse en caso de incertidumbre calibrada) se enviaron a agentes de investigación paralelos, y todas las **27 citas resultantes** se validaron mediante el paso 4 antes de que ninguna influyera en el diseño. El oráculo de recuperación confirmó la **existencia de 27/27** (incluidos seis artículos de 2025-2026 que un modelo paramétrico habría marcado erróneamente como fabricados) y corrigió cinco atribuciones que un modelo no podría haber identificado, entre ellas una atribución incorrecta real del autor principal que el agente de investigación identificó en sí mismo. Al ejecutarlo sin razonamiento previo, las diferentes perspectivas incluso reprodujeron sus propios modos de fallo documentados en nuestra prueba: uno etiquetó con confianza erróneamente un artículo real, y su *desacuerdo* desencadenó una escalada, exactamente como lo prescribe la cascada. La prueba completa se incluye como [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md); las mejoras que se aplicaron (fundamentación descompuesta/ternaria, búsqueda en el momento de la generación, cascada validada por el oráculo y abstención calibrada) se encuentran en [PROTOCOL.md](PROTOCOL.md).

## Cómo está configurado

Puede ejecutar el protocolo manualmente; cualquier modelo de una familia diferente más la resolución manual de arXiv/DOI satisface el paso 4. Dos herramientas complementarias lo convierten en un solo comando:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)**: el verificador en tiempo de ejecución: enrutamiento entre familias diferentes, sin razonamiento previo, adjudicación con múltiples perspectivas, un límite determinista para la existencia de referencias (arXiv → Crossref) y recibos firmados.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)**: proporciona `roleos verify-citations <dispatch>`, el ejecutor que extrae las citas de una prueba y las valida mediante prism.

La transferencia es el propio formato de la prueba: un hallazgo escrito como `N. **hallazgo.** Autores año (arXiv|DOI). implicación.` —con **un identificador resoluble por cada hallazgo— es exactamente lo que `roleos verify-citations` extrae y valida. Una prueba "limpia" se transfiere sin problemas; una cita malformada es lo que el ejecutor marca como no analizada. Este contrato es lo que `study-swarm lint` verifica localmente, por lo que los pasos 3 y 4 coinciden en lo que es una cita.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Comando | Qué hace |
|---|---|
| `study-swarm protocol` | Imprime el protocolo completo: los cinco pasos, la tabla de detención y el estándar de fuentes. |
| `study-swarm new <slug>` | Crea un archivo `<slug>.dispatch.md` con el esqueleto de los cinco pasos para completarlo. |
| `study-swarm lint [--json] <path…>` | Verifica la *fundamentación de la investigación* de una prueba en comparación con el estándar de fuentes: cada hallazgo necesita un autor, un año y un identificador resoluble (arXiv / DOI / URL); se rechaza cualquier afirmación vaga del tipo "los estudios demuestran...". Sale con código `1` si hay infracciones, por lo que valida la integración continua. Un `<path>` puede ser un archivo, un directorio (se analiza recursivamente para archivos `*.dispatch.md`) o `-` para la entrada estándar; `--json` emite un informe legible por máquina. |

`lint` es determinista: no realiza llamadas al modelo, por lo que es seguro en la integración continua. Aplica el **estándar de fuentes del paso 3** localmente; la verificación basada en modelos del **paso 4** sigue utilizando [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

Un ciclo típico:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Dos pruebas completas y "limpias" se incluyen como referencias: [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (la decisión central del protocolo, concisa) y [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (el diseño completo de la versión 1.1: 27 citas, todas verificadas externamente).

### Valídalo en la integración continua

`lint` acepta un archivo, un directorio (se analiza recursivamente para archivos `*.dispatch.md`) o `-` para la entrada estándar, y `--json` emite un informe legible por máquina. Incluya esto en su repositorio para validar las fuentes de cada prueba en cada solicitud de extracción (también hay una muestra que se puede copiar y pegar en [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

```yaml
# .github/workflows/dispatches.yml
name: study-swarm lint
on:
  pull_request:
    paths: ['**/*.dispatch.md', '.github/workflows/dispatches.yml']
  workflow_dispatch:
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx @dogfood-lab/study-swarm@latest lint dispatches/
```

## Por qué funciona, en pocas palabras

**Actual:** el campo evoluciona rápidamente; exigir estudios específicos con años evita que los diseños se retrasen 18 meses. **Funcional:** la evidencia muestra lo que *falla*, no solo lo que funciona (las explicaciones pueden aumentar la dependencia excesiva de la IA *incorrecta* — Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Seguro:** el entorno protegido por el verificador es la arquitectura que respalda la evidencia, y el protocolo lo aplica a su propia salida. La verificación de fuentes no es un ejercicio académico; es el rastro de la evidencia.

## Seguridad

`study-swarm` incluye una **CLI delgada, con cero dependencias** (`study-swarm`) junto con la metodología. No realiza **ninguna llamada a la red ni al modelo** y no recopila **ningún dato de telemetría**; no hay secretos ni credenciales en el código fuente. En tiempo de ejecución, solo lee el archivo que se le pasa a `lint` y escribe un único archivo `<slug>.dispatch.md` en el directorio actual para la opción `new` (rechazando sobrescribir y nunca saliendo del directorio de trabajo). La verificación basada en modelos que describe la metodología (paso 4) la realizan las herramientas complementarias, no este paquete. Consulte [SECURITY.md](SECURITY.md).

## Estado

Un protocolo funcional, verificado externamente por su propio mecanismo: una familia de modelos diferente verifica sus citas (vea la prueba anterior). La **versión 1.1** mejora el verificador donde la primera versión no lo hacía: fundamentación descompuesta/ternaria, búsqueda en el momento de la generación, cascada validada por un oráculo para combinar perspectivas y abstención calibrada; todo ello se basa en la prueba verificada de la versión 1.1. Este repositorio es la referencia pública; [PROTOCOL.md](PROTOCOL.md) es la forma ejecutable. Forma parte de la familia [dogfood-lab](https://github.com/dogfood-lab): métodos y ejemplos para construir en la era de la IA.

Con licencia MIT.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
