<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**将设计决策建立在引用的研究基础上——然后，在任何内容成为标准之前，使用*不同的*模型系列来验证这些引用。**

`study-swarm` 是一种协议，而不是一种工具。当您使用大型语言模型 (LLM) 做出重大的设计决策时——例如，创建一个新的产品层、选择一种架构，或者决定“我们是否应该在这里信任该模型”——如果仅凭经验进行设计，会导致设计陈旧；如果仅凭记忆引用论文，会导致设计依赖于不存在或内容与您认为的不同来源。`study-swarm` 替代了这两种方法：它会派遣并行研究代理，要求提供具体的引用结果，并且在任何引用结果影响设计之前，都会通过一个**来自不同模型系列的外部验证器**进行验证。

它会自我应用。该协议规定，对于它所帮助设计的系统，必须使用经过验证器保护的机制——因此，它也会对自己进行验证。**没有模型会自己批改作业，包括运行该协议的模型。**

## 该协议包含五个步骤

1. **确定** 3-5 个关键的设计问题，如果存在经验证据，这些证据可能会改变答案。
2. **派遣**一个研究代理来处理每个问题，并并行进行。每个代理都必须返回论文标题 + 作者 + 年份 + URL + 一句话的结论——强调具体性而非广泛性（“6-8 个来源可靠的结论胜过 20 个模糊的描述”）。
3. **将结论综合**到“研究依据”部分：`N. **<结论>.** <作者> <年份> (<arXiv/DOI>). <设计意义>.`
4. **进行外部验证**——一个*不同的模型系列*，去除推理能力，以两个阶段检查每个引用：一个**检索预言机**确认论文是否存在（永远不是模型的记忆），然后一个**相关性**过滤器确认结论与来源是否匹配。如果发现捏造或错误引用，则**停止**；如果验证器或检索预言机不可用，则**停止并升级**（永远不要将无法找到的情况视为“引用没问题”）。
5. **将每个架构选择与一个结论联系起来**，并按编号进行。没有设计意义的引用就是噪音。

完整的可执行细节——停止表、来源标准、集成规则——都包含在 **[PROTOCOL.md](PROTOCOL.md)** 中。

## 为什么需要一个*不同的*模型系列，并且去除推理能力？

因为失败模式是经过记录的，而不是假设的：

- **大型语言模型无法可靠地验证自己的输出。** Huang 等人，2023 年 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798))；Kambhampati 等人，2024 年 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817)，LLM-Modulo)；Stechly 等人，2024 年 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115))——外部验证器可以带来收益；自我批评的内容是无效的。
- **同一系列的评估者会偏向于自我。** Panickssery、Bowman 和 Feng，2024 年 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076))——自我识别与自我偏好呈*线性*相关，因此部分隐藏并不能提供帮助。Verga 等人，2024 年 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796)，PoLL))——来自不同系列的评估小组的偏见更小，成本约为原来的 1/7。
- **大型语言模型最容易在引用方面撒谎。** Walters 和 Wilder，2023 年 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5))——55% 的 GPT-3.5 / 18% 的 GPT-4 引用是捏造的。Onweller 等人，2026 年 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635))——链接可以解决超过 94% 的问题，但只有 39-77% 的引用内容实际上支持该主张。因此，必须通过**检索**来检查是否存在，而不是通过**回忆**。
- **隐藏生成器的推理过程。** Khalifa 等人，2026 年 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691)，“欺骗评估者”)——仅通过操纵思维链，就可以使评估者的假阳性率提高高达 90%，而操作保持不变。Turpin 等人，2023 年 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388))——思维链是一种事后合理化。验证器只会看到裸露的引用声明，而不会看到“我为什么包含这个”。
- **多样性胜过数量。** Rajan，2025 年 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708))——四个验证器，成对相关性 ρ ∈ [0.05, 0.25]，通过亚模覆盖胜过任何一个智能评估者。Kim 等人，2025 年 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962))——大型语言模型的错误是*相关的*，因此关键变量是验证器的多样性，而不是原始数量。

## 它真的有效吗？（证明）

作为一项测试，该协议被应用于它自己的引用。两个不相关的非 Claude 系列——**Mistral** (`mistral-small:24b`) 和 **IBM Granite** (`granite4.1:30b`)——检查了一组引用，并去除了推理能力，并设置了两个盲目陷阱：

| 设置的陷阱 | Mistral | IBM Granite | 真实情况 |
|---|---|---|---|
| 思维链提示归因于“Nakamura & Olsen” | 未发现 | **发现**（错误归因 → 实际上是 Wei 等人，2022 年） | 错误归因 |
| 一个捏造的“98% 的错误已消除，不需要预言机”论文 | **caught** (fabricated) | **caught** (fabricated) | 捏造 |

两个模型单独都没有发现这两个陷阱——但它们的**组合发现了 2/2 个陷阱**。如果只有一个评估者，它会忽略错误归因。此外，检索预言机发现了我们自己设计文档中两个*真实的*错误归因（引用了错误的作者），而任何参数化的大型语言模型都无法识别——并且它正确地确认了 2026 年的真实论文，而这两个大型语言模型都错误地将其标记为捏造，仅仅是因为这些论文的发表时间晚于它们的训练时间。最后一点是，步骤 4 的存在性检查**必须**使用检索预言机，而不是大型语言模型。

这个简单的测试就是缩影：**不相关的验证器 + 用于验证存在性的检索预言机，胜过任何一个智能评估者。**

## 它的工作原理

您可以手动运行该协议——任何不同的模型系列，再加上您自己解析 arXiv/DOI，就可以满足步骤 4 的要求。两个辅助工具可以将其简化为一个命令：

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — 运行时验证器：不同类型的路由、去除推理过程、多角度仲裁、确定性的检索存在性保障（arXiv → Crossref），以及带签名的收据。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — 提供 `roleos verify-citations <dispatch>` 命令，该命令用于提取某个任务的引用，并通过 prism 进行验证。

## 它为何有效，一言以蔽之

**实用性** — 该领域发展迅速；要求进行特定且耗时的研究，会导致设计落后 18 个月。**功能性** — 证据表明哪些*失败*，而不仅仅是哪些有效（解释可能会增加对*错误*人工智能的过度依赖——Bansal 等人，2021 年）。**安全性** — 验证器保护的范围是证据支持的架构，协议对其自身的输出进行强制执行。来源不是学术表演；它是证据链。

## 安全性

`study-swarm` 是一个文档仓库——包含 Markdown 文件和一个徽标。它不包含任何可执行代码，也不从该仓库安装任何内容。它不涉及任何数据，不需要任何权限，也不收集任何遥测数据；源代码中没有秘密或凭据。该方法*描述*了一种使用网络检索和基于模型的验证的工作流程，但此仓库不实现或运行该流程。请参阅 [SECURITY.md](SECURITY.md)。

## 状态

一个可运行的协议，由其自身的机制进行外部验证——不同的模型家族检查其引用（参见上面的证明）。此仓库是公共参考；[PROTOCOL.md](PROTOCOL.md) 是可执行的形式。它是 [dogfood-lab](https://github.com/dogfood-lab) 家族的一部分——用于在人工智能时代构建方法和展示案例。

采用 MIT 许可。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
