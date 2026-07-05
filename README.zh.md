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
| `study-swarm lint [--json] [--strict] <path…>` | 检查某个报告的“研究依据”，并对照来源标准进行验证——每个发现都需要有作者、年份和可解析的标识符（arXiv / DOI / URL / RFC）；禁止使用含糊不清的表述，例如“研究表明……”。如果存在违规情况，则返回 `1`，从而阻止 CI 流程。`<path>` 可以是文件、目录（递归地检查所有 `*.dispatch.md` 文件），或者 `-` 表示标准输入；`--json` 会输出机器可读的报告。`--strict` 还会标记“孤立引用”——即某个发现没有被任何第五步选项引用，因为“没有关联的引用是无用的”（可选功能，因此默认的 CI 流程不会改变）。 |
| `study-swarm lock --init <dispatch>` | 生成 `<dispatch>.orchestration.json` 文件——这是一个填空式的框架记录（每个步骤对应一个第二步中的代理），用于提供给 `lock … --from` 命令。 |
| `study-swarm lock <dispatch> --from <orchestration.json>` | 将一个调度固定下来以便重放——编写 `<dispatch>.lock.json`，其中包含基于内容的哈希值，按照步骤 2 中的代理进行操作，包括**已解析的模型 ID** + **字节级精确提示的 SHA-256 值** + **工具模式的 SHA-256 值**，以及步骤 4 中的**验证者凭证**，并将它们组合成一个 `lock_sha256`。 |
| `study-swarm lock --verify <dispatch> [--from …]` | 重新计算这些哈希值并确认它们与锁匹配；如果出现任何偏差，则退出并返回 1，因此它就像软件包的 lock 文件一样，可以控制 CI 流程。如果不使用 `--from` 参数，则会检查锁自身的完整性。 |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | **规范回滚补偿器。** 标记语料库中每个引用 `<id>` 作为“证据已撤回”（一个墓碑侧文件 `<slug>.withdrawn.json`——标记，永不删除）的文档，并生成基于内容的撤回凭证。 `--reason` ∈ `fabricated · misattributed · retracted · verifier-flipped · other`。 |
| `study-swarm requalify --check <corpus-dir>` | 对于任何带有未解决的“证据已撤回”标志的文档，执行失败安全机制（退出代码为 `1`）——这是一种“andon”（警报），它会**阻止**已撤回结论的依赖项，直到该结论被删除或重新验证。用于门控 CI。 |
| `study-swarm requalify --status <corpus-dir> [--json]` | 以只读方式查看语料库的“证据健康状况”——包括已撤回和已解决的数量、按原因和解决方法分类，以及每个报告的行数。这是一个信息性输出（返回 `0`），与 `--check` 流程不同。 |
| `study-swarm requalify --resolve <dispatch> <id> --mode removed\ | regrounded [--note …]` | 一旦该结论被删除（引用消失）或重新验证（由辅助运行器重新验证；`--note` 记录证明），则清除标志。幂等性；附加到侧文件的审计跟踪中。 |

`lint`是确定性的——不调用任何模型——因此可以在CI中安全使用。它在本地强制执行**第3步的来源标准**；基于模型的**第4步**验证仍然依赖于[`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism。

一个典型的循环：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

四个完整的、经过代码检查的文档作为参考发布：[`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md)（协议的核心决策，简洁），[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)（完整的 v1.1 设计版本——27 个引用，每个引用都经过外部验证），[`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md)（v1.2 锁定设计——39 个引用，通过运行器进行门控，并且是第一个发布其自身锁定的文档），以及 [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md)（v1.3 规范回滚设计——27 个引用，涵盖撤销、撤稿、连续事件和构建失效，并且是第一个被撤回然后重新验证的文档）。

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
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx @dogfood-lab/study-swarm@latest lint dispatches/
      # Halt the build while any finding that became canon is withdrawn and not yet
      # removed or re-grounded — the canon-rollback andon (exit 1 on any unresolved flag).
      - run: npx @dogfood-lab/study-swarm@latest requalify --check dispatches/
```

### 将一个调度固定下来以便重放 (`dispatch.lock.json`)

只有当你能够说明*是什么产生了它*时，才能对经过验证的调度进行审计。`study-swarm lock` 编写一个配套的锁文件，该文件基于内容进行哈希处理，按照研究代理进行操作，包括**已解析的模型 ID（绝不使用浮动别名）**、**字节级精确提示的 SHA-256 值**以及**工具模式的 SHA-256 值**，以及外部**验证者凭证**——所有这些都组合成一个 `lock_sha256`。`study-swarm lock --verify` 重新计算这些哈希值，并且如果出现任何偏差，则会失败并停止，因此，如果提示、模型或工具发生更改，系统都会检测到——这是 [PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm) 可重复性标准的可执行版本。该框架会输出记录；CLI 保持零依赖和无网络状态，仅进行规范化（RFC 8785）、哈希处理和验证。

**它固定输入，而不是输出。** 固定模型 + 提示 + 温度并不能使 LLM 的输出完全相同——批处理不变性、浮点数非结合律、混合专家路由以及无声提供者漂移都超出了离线工具的控制范围。因此，该锁为您提供**可重放的输入和可检测偏差的输出**，而不是“确定性重放”。该设计基于 [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) 中的每一处引用，并且是第一个发布其自身锁（[`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)）的调度文件。

### 回滚已撤回的结论 (`withdraw` / `requalify`)

经过验证的结论成为**规范**——它会影响下游决策。那么，如果稍后该结论被**撤回**（在重新运行时发现引用是捏造/错误归因，引用的论文被撤稿，或者门控机制将其标记），会发生什么？简单的 `git revert` 并不足以解决问题，因为该结论已经传播开来。规范回滚补偿器使清理过程可执行：

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a tombstone sidecar — flag, never delete)
#     and writes a content-addressed withdrawal receipt naming every dependent.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed   # or: --mode regrounded --note "<attestation>"
```

`requalify --check` 在每个带有标志的结论被删除或**重新验证**（由辅助运行器重新验证——CLI 记录证明，它本身不会重新验证）之前，将**失败安全**。撤回以**对比方式**呈现，而不是默默地删除。所有内容——墓碑和凭证——都基于内容进行寻址且可检测漂移，并且仅对*证据*层进行操作：`lock --verify` 不受撤回的影响。该设计基于 [`examples/study-swarm-canon-rollback.dispatch.md`](examples/study-swarm-canon-rollback.dispatch.md)，并且 [PROTOCOL.md](PROTOCOL.md) §“补偿已撤回的结论”是可执行的形式。这是**NAMED_COMPENSATORS** 标准的可执行版本：一种命名的、幂等的撤销操作，它会留下一个已知的后期状态和一个凭证。

## 用一句话概括其工作原理

**及时性**——该领域发展迅速；要求提供具体的带有年份的研究，可以防止设计落后18个月。**功能性**——证据表明哪些*方法失败*，而不仅仅是哪些有效（解释可能会增加对*错误*人工智能的过度依赖——Bansal等人，2021年，[arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性**——受验证器保护的范围是证据支持的架构，并且协议对其自身的输出进行强制执行。来源不是学术上的形式主义；它是证据链。

## 安全性

`study-swarm`提供了一个**轻量级、零依赖的CLI**（`study-swarm`），以及该方法论。它**不进行任何网络或模型调用，也不收集任何遥测数据**；源代码中没有秘密或凭据。在运行时，它只会读取您传递给`lint`的文件，并在当前目录中写入一个`<slug>.dispatch.md`文件（拒绝覆盖，并且绝不会超出工作目录）。该方法论描述的基于模型的验证（第4步）由辅助工具执行，而不是由此软件包执行。请参阅[SECURITY.md](SECURITY.md)。

## 状态

一个可行的协议，通过其自身的机制进行外部验证——不同的模型系列会检查其引用（参见上面的证明）。**v1.1** 版本改进了验证器，解决了首次发布版本中存在的不足：分解/三元依据、生成时间依据、用于组合不同视角的基于预言机的级联方法以及校准的弃权机制——所有这些都以经过验证的 v1.1 报告为基础。**v1.2** 版本使报告能够进行字节级别的重放：`study-swarm lock` 命令会固定每个步骤中已解决的模型、提示和工具模式，以及验证器收据；`lock --verify` 命令会在检测到漂移时停止流程。**v1.3** 版本使回滚操作可执行：当某个已经成为标准的事实被撤回时，`study-swarm withdraw` 命令会标记所有相关的依赖项，并且 `requalify --check` 命令会暂停这些依赖项的运行，直到它们被删除或重新验证——这是一个命名的、带有收据的、幂等的补偿器。**v2.0** 版本使协议中的更多部分可执行，并加强了锁定机制：`lint --strict` 命令会标记孤立引用——这是 CLI 无法捕获的唯一一种失败模式；`lock --init` 命令会生成框架记录；`requalify --status` 命令会读取语料库的证据健康状况；锁定的内容寻址是领域隔离的（工件模式 v2——来自早期版本的锁定会被重新生成，而不是被错误地标记为已篡改；CLI 的命令界面保持向后兼容）。此仓库是公共参考；[PROTOCOL.md](PROTOCOL.md) 是可执行的形式。它是 [dogfood-lab](https://github.com/dogfood-lab) 系列的一部分——用于构建人工智能时代的方法和示例。

采用MIT许可证。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
