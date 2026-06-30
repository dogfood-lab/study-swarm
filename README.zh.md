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

首先，将设计决策建立在引用的研究基础上——然后，在使用这些研究成果之前，请使用*不同的*模型系列来验证引用的准确性。

`study-swarm` 是一种协议，而不是一种工具。当您使用大型语言模型（LLM）做出重大设计决策时——例如，创建一个新的产品层、选择一种架构，或者决定“我们是否应该信任该模型”——如果只是凭经验进行即兴创作，那么最终的设计方案就会显得陈旧；如果只是凭记忆引用论文，那么设计方案就会依赖于不存在的来源或与您认为的内容不符的来源。`study-swarm` 可以取代这两种做法：它会同时启动多个研究代理，要求提供具体的引文结果，并且在将任何引文用于指导设计之前，都会通过**来自不同模型系列的外部验证器**进行验证。

它采取了自我调节的方式。该协议规定，对于其参与设计的系统，应使用经过验证者保护的信封——因此，它也将其应用于自身。**没有任何模型会自己批改作业，包括运行该协议的模型。**

## 五步流程

1. **确定** 3 到 5 个关键的结构设计问题，这些问题的答案可以通过实证证据来改变。
2. **指派** 一名研究人员负责每个问题，并让他们并行工作。每位研究人员必须提供论文标题、作者、发表年份、网址以及一个简短的结论（强调具体性而非广泛性，“6 到 8 个有充分依据的结论胜过 20 个含糊不清的描述”）。
3. **综合** 这些结论，形成一个“*研究基础*”部分：`N. **<结论>.** <作者> <年份> (<arXiv/DOI>)。 <设计启示>。`
4. **进行外部验证**——使用一种*不同的模型系列*，去除推理能力后，分两个阶段检查所有引用文献：首先，一个**检索预言机**确认论文是否存在（绝不能依赖模型的记忆），然后，一个**真实性评估工具**确认结论是否与来源一致。如果发现捏造或错误归因的引用，则立即**停止**；如果验证者或检索预言机不可用，则**停止并升级处理**（切勿将无法找到的情况解读为“引用没有问题”）。
5. **将**每个结构设计选择与相应的结论联系起来，通过编号进行关联。如果没有明确的设计启示，那么这些引用就是噪音。

完整的可执行细节——包括停止表、源标准和集成规则——都可以在**[PROTOCOL.md]**文件中找到。

## 为什么会是另外一个家庭？而且，请不要再进行任何推测

因为这里记录的是实际发生的故障模式，而不是假设的故障模式：

- **大型语言模型无法可靠地验证自身输出。** Huang 等人，2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798))；Kambhampati 等人，2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817)，LLM-Modulo)；Stechly 等人，2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115))——外部验证者承担了主要的改进作用；自我评价的内容是静态的。
- **同一系列的评估者更倾向于选择自身的结果。** Panickssery、Bowman 和 Feng，2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076))——自我识别与自我偏好呈*线性*相关，因此部分隐藏信息并不能起到帮助作用。Verga 等人，2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796)，PoLL)——由不同系列的评估者组成的团队的偏见更小，且成本约为原来的 1/7。
- **大型语言模型最容易在引用时造假。** Walters 和 Wilder，2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5))——GPT-3.5 中 55% 的引用，GPT-4 中 18% 的引用是捏造的。Onweller 等人，2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635))——链接在超过 94% 的情况下可以找到，但只有 39-77% 的引用内容实际上支持了论点。因此，必须通过**检索而非回忆**来验证其存在性。
- **隐藏生成器的推理过程。** Khalifa 等人，2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691)，“欺骗评估者”)——仅通过操纵思维链，就可以使评估者的假阳性率提高高达 90%，而操作条件保持不变。Turpin 等人，2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388))——思维链是一种事后合理化。验证者只能看到原始的引用声明，而无法了解“我为什么包含这个”。
- **多样性胜过数量。** Rajan，2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708))——四个评估者之间的成对相关性 ρ ∈ [0.05, 0.25]，通过次模覆盖，其效果优于任何单个评估者。Kim 等人，2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962))——大型语言模型的错误是*相关的*，因此，关键变量是视角的多样性，而不是单纯的数量。

## 它真的有效吗？（请提供证据）

为了进行测试，我们将该协议应用于其自身的引用文献。我们选择了两个与 Claude 模型无关的模型系列——**Mistral**（`mistral-small:24b`）和 **IBM Granite**（`granite4.1:30b`），并对它们进行了测试。测试内容包括：检查一组引用文献，去除推理过程中的干扰因素，并在其中设置了两个隐藏的陷阱。

| 设下陷阱。 | 米斯特拉尔 | IBM 花岗岩（IBM Granite） | 真实数据；基准数据。 |
|---|---|---|---|
| “中村和奥尔森”提出的基于思维链的提示方法。 | 错过；想念。 | **已更正**（原错误归因，现改为：魏等人，2022年，arXiv:2201.11903） | 错误归因；错误地认为……是……所为。 |
| 一篇捏造的论文，声称“已消除 98% 的错误，无需使用 Oracle”。 | **caught** (fabricated) | **caught** (fabricated) | 捏造的；伪造的。 |

两个家庭都未能单独成功设置这两个陷阱——但他们合作后，两个陷阱都成功触发了。如果由一位法官来判断，可能会出现误判。此外，检索系统在我们的设计文档中发现了两个真实的错误归因（即引用时将论文归于错误的作者），而任何参数化的大型语言模型都无法识别这些错误——并且它正确地确认了真正的 2026 年发表的论文，这两篇论文之前被两个大型语言模型错误地标记为虚构，仅仅是因为这些论文的发表时间晚于它们接受训练的时间。最后这一点是第四步存在检查必须采用检索系统而非大型语言模型的根本原因。

那一次实验结果，可以被视为一个微缩版的论点：**通过使用不相关的镜头，并结合一种用于验证存在的检索机制，其效果将优于任何单一的智能判断系统。**

### ……而且，我们还要重新设计 1.1 版本

v1.1版本的改进采用相同的方式进行——通过在“study-swarm”上运行“study-swarm”。第一个版本提出的四个问题（如何*实现*扎实性检查的自动化，是否在生成时进行扎实性验证，如何*组合*不同的视角，以及是否对经过校准的不确定性进行弃权）被分配给并行的研究代理，所有**27条结果引用**都通过第4步进行筛选，然后才用于指导设计。检索预言机确认**27/27条引用存在**——包括六篇2025-2026年的论文，如果使用参数模型，这些论文会被错误地标记为捏造的——并且更正了五处归因错误，而这是模型无法做到的，其中一处是研究代理自己发现的一处真实的作者署名错误。在不进行推理的情况下运行，扎实性视角甚至可以重现其自身记录的失败模式：自信地将一篇真实论文错误地标记为虚假论文，并且它们的*分歧*触发了升级——这与级联机制完全一致。经过验证的工作流程以[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)的形式提供；它所确定的改进（分解/三元扎实性、生成时扎实性、由预言机控制的级联机制以及经过校准的弃权）都包含在[PROTOCOL.md](PROTOCOL.md)中。

## 其工作原理

您可以手动运行该协议——任何不同类型的模型，再加上您自己解析arXiv/DOI，都可以满足第4步的要求。两个辅助工具使其只需一个命令即可完成：

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)**——运行时验证器：不同类型的模型路由、无推理、多视角仲裁、确定性的检索存在性阈值（arXiv → Crossref）以及带签名的收据。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)**——提供`roleos verify-citations <dispatch>`，该工具提取工作流程中的引用并将其通过prism进行筛选。

传递过程就是工作流程的格式：将研究结果写成`N. **finding.** Authors year (arXiv|DOI). implication.`的形式——**每条研究结果都包含一个可解析的标识符**——这正是`roleos verify-citations`提取和筛选的内容。如果工作流程符合“lint”规范，则可以顺利传递；如果引用格式不正确，运行器会将其标记为未解析。`study-swarm lint`会在本地检查这一点，因此第3步和第4步对引用的定义是一致的。

## 命令行界面（CLI）

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| 命令 | 其作用 |
|---|---|
| `study-swarm protocol` | 打印完整的协议——五个步骤、停止表以及来源标准。 |
| `study-swarm new <slug>` | 创建一个`<slug>.dispatch.md`文件，其中包含五步流程的框架，以便进行填充。 |
| `study-swarm lint [--json] <path…>` | 根据来源标准检查工作流程的*研究扎实性*——每条研究结果都需要作者、年份和一个可解析的标识符（arXiv / DOI / URL）；“研究表明……”这种含糊其辞的方式将被拒绝。如果存在违规行为，则退出代码为`1`，以便在CI中进行筛选。`<path>`可以是文件、目录（递归地检查所有`.dispatch.md`文件），或者`-`表示标准输入；`--json`会输出机器可读的报告。 |

`lint`是确定性的——不调用任何模型——因此可以在CI中安全使用。它在本地强制执行**第3步的来源标准**；基于模型的**第4步**验证仍然依赖于[`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism。

一个典型的循环：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

两个完整的、符合“lint”规范的工作流程示例以供参考：[`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md)（协议的核心决策，简洁）和[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md）（完整的v1.1设计流程——27条引用，每一条都经过外部验证）。

### 在CI中进行筛选

`lint`接受文件、目录（递归地检查所有`.dispatch.md`文件）或`-`表示标准输入，并且`--json`会输出机器可读的报告。将其添加到您的代码库中，以便对每个PR中的每个工作流程的来源进行筛选（一个复制粘贴示例也位于[`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)中）：

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

## 用一句话概括其工作原理

**及时性**——该领域发展迅速；要求提供具体的带有年份的研究，可以防止设计落后18个月。**功能性**——证据表明哪些*方法失败*，而不仅仅是哪些有效（解释可能会增加对*错误*人工智能的过度依赖——Bansal等人，2021年，[arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性**——受验证器保护的范围是证据支持的架构，并且协议对其自身的输出进行强制执行。来源不是学术上的形式主义；它是证据链。

## 安全性

`study-swarm`提供了一个**轻量级、零依赖的CLI**（`study-swarm`），以及该方法论。它**不进行任何网络或模型调用，也不收集任何遥测数据**；源代码中没有秘密或凭据。在运行时，它只会读取您传递给`lint`的文件，并在当前目录中写入一个`<slug>.dispatch.md`文件（拒绝覆盖，并且绝不会超出工作目录）。该方法论描述的基于模型的验证（第4步）由辅助工具执行，而不是由此软件包执行。请参阅[SECURITY.md](SECURITY.md)。

## 状态

一个可用的协议，其自身的机制对其进行了外部验证——不同的模型系列检查其引用（参见上面的证明）。**v1.1**改进了验证器，弥补了第一个版本中存在的不足：分解/三元扎实性、生成时扎实性、由预言机控制的级联机制以及经过校准的弃权——每项都基于经过验证的v1.1工作流程。此仓库是公共参考；[PROTOCOL.md](PROTOCOL.md)是可执行的形式。它是[dogfood-lab](https://github.com/dogfood-lab)系列的一部分——用于在人工智能时代构建方法和示例。

采用MIT许可证。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
