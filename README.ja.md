<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**引用された研究に基づいて設計上の決定を行い、その後、そのすべての内容が公式なものになる前に、*別の*モデルファミリーを使用して引用を検証する。**

`study-swarm`はツールではなくプロトコルである。大規模言語モデル（LLM）を用いて重要な設計上の決定を行う場合（新しい製品レイヤー、アーキテクチャの選択、「ここでモデルを信頼すべきか」という判断など）、最初の原則から即興で進めることは、時代遅れの設計につながり、記憶に基づいて論文を引用することは、存在しない情報源や、あなたが考えていることとは異なる内容の情報源に依存する設計につながる。`study-swarm`はこれら両方を置き換える：並行して研究エージェントを派遣し、特定の引用された調査結果を要求し、すべての引用を**別のモデルファミリーの外部検証者**を通じてゲートすることで、その情報が設計に影響を与えるようにする。

それは独自の治療法を適用する。このプロトコルは、支援するシステムの設計において、検証者によって保護されたエンベロープを規定するため、それ自体にもそれを適用する。**プロトコルを実行しているモデルを含め、どのモデルも自分の宿題を評価しない。**

## 5つのステップで構成されるプロトコル

1. **特定する**：経験的証拠によって回答が変わる可能性のある3〜5個の重要な設計上の質問を特定する。
2. **派遣する**：各質問に対して、並行して1つの研究エージェントを派遣する。それぞれが論文タイトル＋著者＋年＋URL＋1文の調査結果を返す必要がある（網羅性よりも具体性を重視：「6〜8件の信頼できる調査結果は、20件の曖昧な記述よりも優れている」）。
3. **統合する**：調査結果を「研究による根拠」セクションに統合する：`N. **<調査結果>.** <著者> <年> (<arXiv/DOI>). <設計への影響>.`
4. **外部で検証する**：*別のモデルファミリー（推論機能を削除したもの）が、2つの段階ですべての引用をチェックする。まず、**検索オラクル**が論文が存在することを確認する（モデルの記憶ではなく）。次に、「根拠」レンズが、調査結果が情報源と一致することを確認する。**捏造または誤った帰属の場合、処理を停止する。検証者または検索オラクルが利用できない場合は、処理を停止してエスカレーションする（不在を「引用は問題ない」と解釈しないこと）。
5. **関連付ける**：各アーキテクチャの選択を、番号を使って調査結果に関連付ける。設計への影響がない引用はノイズである。

完全な実行可能な詳細（停止テーブル、情報源に関する標準、アンサンブルルール）は、**[PROTOCOL.md](PROTOCOL.md)**に記載されている。

## なぜ*別の*ファミリーで、推論機能を削除する必要があるのか？

それは、失敗モードが仮説ではなく、文書化されているためである：

- **LLMは、自分の出力を確実に検証できない。** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — 外部検証者がメリットをもたらす。自己批判的な内容は効果がない。
- **同じファミリーの評価者は、自分を高く評価する傾向がある。** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — 自己認識は、自己選好と*線形に*相関するため、部分的なブラインド処理では効果がない。Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — 異なるファミリーのパネルを使用すると、約7分の1のコストで偏りが少なくなる。
- **引用は、LLMが嘘をつく場所である。** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — GPT-3.5の55％、GPT-4の18％の引用が捏造されている。Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) —リンクは94％以上の確率で解決するが、引用されたコンテンツのわずか39〜77％しか主張を裏付けていない。したがって、存在は**検索によってチェックする必要があり、想起によってチェックしてはいけない。**
- **生成者の推論を隠す。** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — 操作された連鎖思考だけでは、評価者の誤検出率が最大90％まで増加する（アクションは固定されている）。Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoTは、事後的な合理化である。検証者は、単なる引用の主張のみを確認し、「なぜこれを含めたのか」は確認しない。
- **多様性は数よりも重要である。** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — ペアワイズ相関ρ∈[0.05, 0.25]の4つの検証者は、サブモジュールカバレッジによって、いずれか1つの優れた評価者よりも優れている。Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — LLMのエラーは*相関しているため、重要な変数はレンズの多様性であり、生の数ではない。

## 実際に機能するのか？（証拠）

テストとして、このプロトコルを自分の引用に対して実行した。2つの非相関性の高いClaude以外のファミリー（**Mistral** (`mistral-small:24b`)と**IBM Granite** (`granite4.1:30b`））を使用して、推論機能を削除し、2つのブラインドトラップで設定された引用セットをチェックした。

| 仕掛けられた罠 | Mistral | IBM Granite | 真実 |
|---|---|---|---|
| 「Nakamura & Olsen」に帰属された連鎖思考プロンプト | 見逃した | **検出（誤った帰属→実際にはWei et al. 2022、arXiv:2201.11903）** | 誤って帰属された |
| 「98％のエラーが除去され、オラクルは不要」という捏造された論文 | **caught** (fabricated) | **caught** (fabricated) | 捏造された |

どちらのファミリーも単独では両方の罠を検出できなかったが、**それらの組み合わせで2/2を検出した。** 単一の評価者は、誤った帰属を認めてしまうだろう。別途、検索オラクルは、当社の設計ドキュメントにある2つの*実際の*誤った帰属（間違った最初の著者に引用された論文）を検出し、どのパラメトリックLLMも検出できなかった。また、両方のLLMが、トレーニング後の論文であるという理由だけで、捏造されたと誤ってフラグを立てた真の2026年の論文を正しく確認した。最後の点は、ステップ4の存在チェックが**検索オラクルでなければならず、LLMであってはならない**という理由そのものである。

この単一の実行は、ミニチュア版の論文である：**相関性の低いレンズ＋存在を検証するための検索オラクルは、優れた評価者よりも優れている。**

### …そして再び、v1.1の設計のために

v1.1の改良は、同じ方法で選択された。つまり、「study-swarm」上で「study-swarm」を実行することによってだ。最初のリリースで「おそらく」という回答になった4つの質問（根拠チェックをどのように*機械化*するか、生成時に根拠を示すべきか、レンズをどのように*組み合わせるか、不確実性の評価において保留すべきかどうか）は、並行して研究を行うエージェントに割り当てられ、得られた**27件の参考文献**はすべて、設計に反映される前にステップ4で検証された。検索オラクルは、**27/27件が存在すること**を確認した。これには、パラメトリックモデルが捏造されたものとして誤ってフラグを立てるであろう6つの2025〜2026年の論文も含まれており、また、モデルでは確認できなかった5つの参考文献の帰属についても修正が行われた。その中には、研究エージェント自身が指摘した実際の最初の著者の誤った帰属も含まれている。推論を排除して実行すると、根拠を示すためのレンズは、私たちのシステムで文書化された自身の失敗モードを再現する。つまり、1つの論文を自信を持って誤って分類し、その*不一致*がエスカレーションを引き起こす。これはまさにカスケードで規定されていることだ。実際に動作するシステムは、[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)として提供される。このシステムで根拠が示された改良点（分解/三項の根拠、生成時の根拠、オラクルによって制御されるカスケード、および校正された保留）は、[PROTOCOL.md](PROTOCOL.md)に記載されている。

## その仕組み

このプロトコルを手動で実行することもできる。異なるモデルと、arXiv/DOIを自分で解決することでステップ4を満たすことができる。2つの関連ツールを使用すると、これを1つのコマンドにまとめることができる。

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — 実行時の検証ツール：異なるモデルファミリーへのルーティング、推論を排除した処理、複数のレンズによる判断、決定的な検索の存在確認（arXiv → Crossref）、および署名されたレシート。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — `roleos verify-citations <dispatch>`コマンドを提供し、このコマンドはディスパッチから参考文献を抽出し、prismを通じて検証する。

引き継ぎのプロセスは、ディスパッチ形式そのものである。`N. **finding.** Authors year (arXiv|DOI). implication.`という形式で記述された結果（**各結果に対して1つの解決可能な識別子**）が、`roleos verify-citations`によって読み込まれ、検証される。lintチェックに合格したディスパッチは、問題なく引き継がれる。形式が正しくない参考文献は、実行時に解析不能としてフラグが立てられる。この契約内容は、`study-swarm lint`によってローカルでチェックされるため、ステップ3とステップ4では、参考文献の定義について合意が得られる。

## CLI（コマンドラインインターフェース）

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| コマンド | その機能 |
|---|---|
| `study-swarm protocol` | 完全なプロトコル（5つのステップ、停止テーブル、ソースの標準）を表示する。 |
| `study-swarm new <slug>` | 5つのステップで構成されたスケルトンを含む`<slug>.dispatch.md`ファイルを生成し、内容を埋めることができるようにする。 |
| `study-swarm lint [--json] <path…>` | ディスパッチの*研究における根拠*をソース標準と比較してチェックする。すべての結果には、著者、年、および解決可能な識別子（arXiv / DOI / URL）が必要であり、「研究によると…」という曖昧な表現は拒否される。違反があった場合、終了コード1で処理が停止するため、CI（継続的インテグレーション）のゲートとして機能する。<path>はファイル、ディレクトリ（`*.dispatch.md`ファイルを再帰的にlintチェック）、またはstdinを表す`-`とすることができる。`--json`オプションを使用すると、機械可読形式のレポートが出力される。 |

`lint`は決定的な処理であり、モデル呼び出しは行わないため、CI環境で安全に使用できる。ローカルで**ステップ3のソース標準**を適用する。モデルベースの**ステップ4**の検証は、[`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prismに委ねられる。

典型的なループ：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

2つの完全で、lintチェックに合格した動作するディスパッチが参照として提供される：[`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md)（プロトコルの中心的な決定であり、簡潔）と[`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md)（完全なv1.1の設計パスであり、27件の参考文献があり、そのすべてが外部で検証されている）。

### CI環境でのゲートとして使用する

`lint`は、ファイル、ディレクトリ（`*.dispatch.md`ファイルを再帰的にlintチェック）、またはstdinを表す`-`を受け取り、`--json`オプションを使用すると、機械可読形式のレポートが出力される。これをリポジトリに組み込むことで、各PR（プルリクエスト）でディスパッチのソースを検証することができる（コピー＆ペーストできるサンプルは、[`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)にも含まれている）。

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

## その仕組みを簡潔に説明する

**最新性** — この分野は急速に進展しているため、特定の研究と年を指定することで、設計が18か月遅れて公開されるのを防ぐことができる。**機能性** — 証拠は、何が*成功するか*だけでなく、何が*失敗する*かを示す（説明は、*間違った*AIへの過度の依存を高める可能性がある—Bansal et al. 2021、[arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性** — 検証ツールによって保護された範囲は、証拠が裏付けるアーキテクチャであり、プロトコルはその出力を強制する。ソースの明示は学術的な儀式ではなく、証拠の追跡である。

## セキュリティ

`study-swarm`は、**軽量で依存関係のないCLI（コマンドラインインターフェース）** (`study-swarm`)と、その方法論を組み合わせて提供する。**ネットワークまたはモデルへの呼び出しは行わず**、**テレメトリも収集しない**。ソースコードには秘密や認証情報は含まれていない。実行時には、`lint`に渡されたファイルのみを読み取り、現在のディレクトリに単一の`<slug>.dispatch.md`ファイルを書き込む（上書きはせず、作業ディレクトリ外には書き込まない）。方法論で説明されているモデルベースの検証（ステップ4）は、このパッケージではなく、関連ツールによって実行される。詳細は[SECURITY.md](SECURITY.md)を参照のこと。

## ステータス

動作するプロトコルであり、その独自のメカニズムによって外部で検証されている。異なるモデルファミリーがその参考文献をチェックしている（上記の証明を参照）。**v1.1**では、最初のリリースでは言及されていなかった点を強化している。具体的には、分解/三項の根拠、生成時の根拠、レンズを組み合わせるためのオラクル制御カスケード、および校正された保留である。これらの要素はすべて、検証済みのv1.1ディスパッチに基づいて根拠が示されている。このリポジトリは公開参照であり、[PROTOCOL.md](PROTOCOL.md)は実行可能な形式である。これは、[dogfood-lab](https://github.com/dogfood-lab)ファミリーの一部であり、AI時代における構築のための方法と事例を紹介するものである。

MITライセンスで提供される。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
