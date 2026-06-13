<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**将设计决策建立在引用的研究基础上——然后，在使用*不同的*模型系列验证引用之前，确保其成为正式内容。**

`study-swarm`是一种协议，而不是一种工具。当您使用LLM做出重大的设计决策时（例如，新的产品层、架构选择或“我们是否应该信任该模型”），从第一性原理出发进行即兴创作会导致过时的设计，而凭记忆引用论文会导致设计依赖于不存在的来源或与您认为的内容不符。`study-swarm`取代了这两种方法：派遣并行研究代理，要求提供具体的引用结果，并在每个引用通过**不同模型系列的外部验证器**后才将其用于指导设计。

它也适用于自身。该协议规定，对于其帮助设计的系统，应使用经过验证器的保护机制——因此，它也在自身上运行这种机制。**没有模型会自己批改作业，包括运行该协议的模型。**

## 该协议包含五个步骤：

1. **确定** 3-5个关键设计问题，如果存在经验证据，答案可能会发生变化。
2. **派遣**每个问题的研究代理，并行进行。每个代理必须返回论文标题+作者+年份+URL+一个句子摘要——强调具体性而非广泛性（“6-8条有充分依据的发现胜过20个模糊的要点”）。
3. **综合**这些发现，形成一份*研究基础*部分：`N. **<发现>.** <作者> <年份> (<arXiv/DOI>)。 <设计意义>.`
4. **进行外部验证**——一个*不同的模型系列*（不带推理能力），以两个阶段检查每个引用：一个**检索预言机**确认论文是否存在（永远不是模型的记忆），然后一个**真实性**过滤器确认该发现与来源是否匹配。如果出现捏造/错误归因，则**停止**；如果验证器或检索预言机不可用，则**停止并升级**（切勿将无法访问视为“引用没问题”）。
5. **将**每个架构选择与编号的发现联系起来。没有设计意义的引用就是噪音。

完整的可执行细节——停止表、来源标准、集成规则——位于**[PROTOCOL.md](PROTOCOL.md)**中。

## 为什么需要*不同的*模型系列，并且不带推理能力？

因为其失败模式是已知的，而不是假设的：

- **LLM无法可靠地验证自身的输出。** Huang等人，2023年（[arXiv:2310.01798](https://arxiv.org/abs/2310.01798)）；Kambhampati等人，2024年（[arXiv:2402.01817](https://arxiv.org/abs/2402.01817)，LLM-Modulo）；Stechly等人，2024年（[arXiv:2402.08115](https://arxiv.org/abs/2402.08115)）——外部验证器具有优势；自我批评的内容是无效的。
- **同一系列的评判者会偏袒自己。** Panickssery、Bowman和Feng，2024年（[arXiv:2404.13076](https://arxiv.org/abs/2404.13076)）——自我识别与自我偏好呈线性相关，因此部分屏蔽没有帮助。Verga等人，2024年（[arXiv:2404.18796](https://arxiv.org/abs/2404.18796)，PoLL）——跨越不同系列的评审团的偏见更小，成本约为原来的 1/7。
- **引用是LLM说谎的地方。** Walters和Wilder，2023年（[doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)）——GPT-3.5的55%和GPT-4的18%的引用是捏造的。Onweller等人，2026年（[arXiv:2605.06635](https://arxiv.org/abs/2605.06635)）——链接可以解决超过94%的问题，但只有39-77%的引用内容实际上支持该声明。因此，必须通过**检索而不是回忆**来检查是否存在。
- **隐藏生成器的推理过程。** Khalifa等人，2026年（[arXiv:2601.14691](https://arxiv.org/abs/2601.14691)，“欺骗评判者”）——仅通过操纵思维链，可以将评判者的假阳性率提高高达90%，同时保持操作不变。Turpin等人，2023年（[arXiv:2305.04388](https://arxiv.org/abs/2305.04388)）——思维链是一种事后合理化。验证器只会看到裸露的引用声明，而不会看到“我为什么包含这个”。
- **多样性胜过数量。** Rajan，2025年（[arXiv:2511.16708](https://arxiv.org/abs/2511.16708)）——四个验证器在成对相关系数ρ∈[0.05, 0.25]时，通过亚模覆盖优于任何单个验证器。Kim等人，2025年（[arXiv:2506.07962](https://arxiv.org/abs/2506.07962)）——LLM的错误是*相关的*，因此关键变量是视角多样性，而不是原始数量。

## 它真的有效吗？（证明）

作为测试，该协议针对其自身的引用进行了运行。两个不相关的非Claude系列——**Mistral** (`mistral-small:24b`)和**IBM Granite** (`granite4.1:30b`)——以无推理的方式检查了一组引用，并设置了两个盲目陷阱：

| 设定的陷阱 | Mistral | IBM Granite | 真实情况 |
|---|---|---|---|
| 思维链提示归因于“Nakamura & Olsen” | 未发现 | **发现**（错误归因→实际上是Wei等人，2022年，arXiv:2201.11903） | 错误归因 |
| 一篇捏造的“98%的错误已消除，无需预言机”论文 | **caught** (fabricated) | **caught** (fabricated) | 捏造 |

两个系列都没有单独发现这两个陷阱——但它们的**组合发现了2/2个。** 单个评判者会忽略错误归因。此外，检索预言机还发现了我们自己设计文档中的两个*真实*的错误归因（引用了错误的作者），而任何参数LLM都无法标记出来——并且它正确地确认了真正的2026年的论文，这两个LLM因为该论文发布时间晚于它们的训练数据而将其错误地标记为捏造。后一点是第4步存在性检查**必须**使用检索预言机的原因，而不是LLM。

这次运行就是缩影：**不相关的视角+用于验证存在的检索预言机胜过任何一个聪明的评判者。**

## 它的工作原理

你可以手动运行该协议——任何不同的模型加上自行解析 arXiv/DOI，即可满足步骤 4。两个辅助工具使其成为一个命令：

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** ——运行时验证器：不同模型的路由、去除推理过程的多镜头仲裁、确定性的检索存在性基准（arXiv → Crossref）以及带签名的收据。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** ——提供 `roleos verify-citations <dispatch>`，该工具提取一个“dispatch”中的引用并将其传递给 prism 进行验证。

数据传输是“dispatch”格式本身：以 `N. **finding.** Authors year (arXiv|DOI). implication.` 形式编写的发现——每个发现都**包含一个可解析的标识符**——这正是 `roleos verify-citations` 工具所处理和验证的内容。如果“dispatch”符合 `lint` 的要求，则可以顺利进行；如果引用格式不正确，该工具会将其标记为未解析。`study-swarm lint` 会在本地检查此约定，因此步骤 3 和步骤 4 对引用的定义保持一致。

## 命令行界面 (CLI)

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| 命令 | 作用 |
|---|---|
| `study-swarm protocol` | 打印完整的协议——五个步骤、停止表和来源标准。 |
| `study-swarm new <slug>` | 创建一个 `<slug>.dispatch.md` 文件，其中包含五步流程的框架，以便进行填充。 |
| `study-swarm lint [--json] <path…>` | 检查“dispatch”的*研究依据*是否符合来源标准——每个发现都需要作者、年份和一个可解析的标识符（arXiv / DOI / URL）；“研究表明……”这种泛泛而谈的方式将被拒绝。如果存在违规行为，则返回 `1`，从而阻止 CI 流程。`<path>` 可以是文件、目录（递归地对所有 `*.dispatch.md` 文件进行 lint 检查），或者 `-` 表示标准输入；`--json` 会输出机器可读的报告。 |

`lint` 是确定性的——不调用任何模型——因此可以在 CI 中安全使用。它在本地强制执行**步骤 3 的来源标准**；基于模型的**步骤 4** 验证仍然依赖于 [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism。

典型的流程：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

一个完整的、符合 `lint` 要求的“dispatch”——将 study-swarm 应用于其自身的设计——包含在 [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) 中，作为参考示例。

### 在 CI 中进行验证

`lint` 接受文件、目录（递归地对所有 `*.dispatch.md` 文件进行 lint 检查），或者 `-` 表示标准输入，并且 `--json` 会输出机器可读的报告。将其添加到你的仓库中，以便在每次 PR 中验证每个“dispatch”的来源（一个复制粘贴示例也包含在 [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml) 中）：

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

## 为什么它有效，一句话概括：

**当前**——该领域发展迅速；要求提供具体的、带有年份的研究，可以防止设计落后 18 个月。**功能性**——证据表明哪些*失败*了，而不仅仅是哪些有效（解释可能会增加对*错误* AI 的过度依赖——Bansal 等人，2021 年，[arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性**——由验证器保护的范围是证据支持的架构，并且该协议对其自身输出进行强制执行。来源不是学术游戏；它是证据链。

## 安全性

`study-swarm` 提供一个**轻量级、零依赖 CLI** (`study-swarm`) 以及该方法论。它**不进行任何网络或模型调用，也不收集任何遥测数据**；源代码中没有秘密或凭据。在运行时，它只会读取你传递给 `lint` 的文件，并在当前目录中写入一个 `<slug>.dispatch.md` 文件（拒绝覆盖，并且绝不会超出工作目录）。该方法论描述的基于模型的验证（步骤 4）由辅助工具执行，而不是由此软件包执行。请参阅 [SECURITY.md](SECURITY.md)。

## 状态

一个可工作的协议，通过其自身的机制进行了外部验证——不同的模型会检查其引用（参见上面的证明）。该仓库是公共参考；[PROTOCOL.md](PROTOCOL.md) 是可执行的形式。它是 [dogfood-lab](https://github.com/dogfood-lab) 系列的一部分——用于构建 AI 时代的方法和示例。

采用 MIT 许可。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
