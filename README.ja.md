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

**引用された研究に基づいて設計上の決定を обосновывайте, そして、それらの決定が公式なものになる前に、*異なる*モデルファミリーを使用して引用の正確性を検証してください。**

`study-swarm`はツールではなくプロトコルです。大規模言語モデル（LLM）を使用して重要な設計上の決定を行う場合（新しい製品レイヤー、アーキテクチャの選択、「ここでモデルを信頼すべきか」という判断など）、最初から即興で進めるのではなく、事前に研究を行い、その結果に基づいて設計すると、時代遅れの設計になったり、存在しない情報源や誤った情報を基にした設計になってしまう可能性があります。`study-swarm`はこれらの問題を解決します。複数の研究エージェントを並行して実行し、特定の引用された調査結果を要求し、すべての引用について**異なるモデルファミリーの外部検証者**を通じて確認してから、それを設計に反映させます。

これは、自らその方法を採用しています。このプロトコルでは、システムがどのように設計されるかを支援する際に、検証者によって保護された情報を提供するように規定されており、そのため、このプロトコル自体にも適用されます。**プロトコルを実行しているモデルであっても、自分の宿題を評価することはできません。**

## このプロトコルは5つのステップで構成されます

1. **特定する**: 経験的な証拠によって回答が変わる可能性のある3〜5個の重要な設計上の質問を特定します。
2. **実行する**: 各質問に対して、複数の研究エージェントを並行して実行します。各エージェントは、論文タイトル+著者+発表年+URL+1文の調査結果を返します（広範囲よりも具体性を重視、「6〜8件の信頼できる調査結果が、20件の曖昧な情報よりも優れている」）。
3. **統合する**: 調査結果を「研究による根拠」セクションにまとめます。`N. <調査結果>。<著者><年>(<arXiv/DOI>)。<設計への影響>。`
4. **外部で検証する**: *異なるモデルファミリー*（推論機能を削除したもの）を使用して、すべての引用について2段階のチェックを行います。まず、**検索オラクル**が論文が存在することを確認します（モデルの記憶ではなく）。次に、「根拠」フィルターが、調査結果が情報源と一致するかどうかを確認します。**捏造または誤った帰属がある場合は、処理を停止します。検証者または検索オラクルが利用できない場合は、処理を停止し、エスカレーションします（ただし、利用できないことを「引用は問題ない」と解釈しないでください）。
5. **関連付ける**: 各アーキテクチャの選択について、番号を使用して対応する調査結果に関連付けます。設計への影響がない引用はノイズです。

完全な実行可能な詳細（停止テーブル、情報源に関する標準、アンサンブルルール）は、**[PROTOCOL.md](PROTOCOL.md)**に記載されています。

## なぜ*異なる*モデルファミリーで、推論機能を削除する必要があるのでしょうか？

その理由は、失敗モードが仮説ではなく、実際に確認されているからです。

- **LLMは、自分の出力を確実に検証できません**。Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — 外部検証者がそのメリットをもたらします。自己批判的な内容は効果がありません。
- **同じファミリーの評価者は、自分を高く評価する傾向があります**。Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — 自己認識と自己選好は*線形に*相関するため、部分的なブラインド処理だけでは効果がありません。Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — 異なるファミリーのパネルを使用すると、約7分の1のコストで偏りが少なくなります。
- **LLMは、引用において嘘をつきます**。Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — GPT-3.5の55%、GPT-4の18%の引用が捏造されています。Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — リンクは94%以上の確率で解決されますが、実際に引用された内容が主張を裏付けているのは、39〜77%に過ぎません。したがって、存在を確認するには、**検索ではなく、リコールを使用する必要があります。**
- **生成者の推論を隠します**。Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — 操作された連鎖思考だけでは、評価者の誤検出率が最大90%まで増加します（ただし、アクションは固定されています）。Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoTは事後的な合理化です。検証者は、単なる引用の主張のみを確認し、「なぜこれを含めたのか」という理由は確認しません。
- **多様性は数よりも重要です**。Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — ペアワイズ相関ρ∈[0.05, 0.25]の4つの検証者は、サブモジュールカバレッジによって、単一の検証者よりも優れた結果をもたらします。Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — LLMのエラーは*相関しているため、重要な変数はレンズの多様性であり、単純な数ではありません。

## 実際に機能するのでしょうか？（証拠）

テストとして、このプロトコルを自分の引用に対して実行しました。2つの非類似のモデルファミリー（**Mistral** (`mistral-small:24b`)と**IBM Granite** (`granite4.1:30b`））を使用して、推論機能を削除した状態で、2つの意図的な罠を含む引用セットを確認しました。

| 仕掛けられた罠 | Mistral | IBM Granite | 真実 |
|---|---|---|---|
| 「Nakamura & Olsen」に帰属された連鎖思考プロンプト | 見逃した | **検出**（誤った帰属→実際にはWei et al. 2022、arXiv:2201.11903） | 誤って帰属された |
| 「98%のエラーが除去され、オラクルは不要」という捏造された論文 | **caught** (fabricated) | **caught** (fabricated) | 捏造された |

どちらのモデルも単独では両方の罠を検出できませんでしたが、**組み合わせることで2/2を検出しました**。単一の評価者であれば、誤った帰属をそのまま採用してしまいます。また、検索オラクルは、当社の設計ドキュメントにある2つの*実際の*誤った帰属（間違った最初の著者に引用された論文）を検出し、どのパラメトリックLLMも検出できなかったことに加え、両方のLLMがトレーニングデータ以降に発表されたため、捏造されたと誤って判断した実際の2026年の論文を正しく確認しました。最後の点が、ステップ4の存在チェックが**検索オラクルでなければならない理由であり、LLMであってはならない理由です。**

この単一の実行は、ミニチュア版の論文です。**相関性の低いレンズと、存在を確認するための検索オラクルを組み合わせることで、いかに優れた評価者よりも優れた結果が得られるかを示しています。**

## その仕組み

手動でプロトコルを実行できます。異なるモデルと、ご自身でarXiv/DOIを解決することで、ステップ4を満たします。2つの関連ツールが連携して、1つのコマンドとして実行されます。

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — 実行時の検証ツール：異なるモデル間のルーティング、推論の簡略化、多角的な判断、決定的な検索による存在確認（arXiv → Crossref）、署名されたレシート。
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — `roleos verify-citations <dispatch>`を提供します。これは、ディスパッチの引用を抽出し、prismを通じて検証する実行ツールです。

ハンドオフは、ディスパッチ形式そのものです。「N. **finding.** 著者 年 (arXiv|DOI). 含意。」という形式で記述された調査結果（**各調査結果に対して解決可能な識別子を1つだけ使用**）が、`roleos verify-citations`によって抽出され、検証されます。 `lint`によるチェックに合格したディスパッチは問題なく処理されます。形式が正しくない引用は、実行ツールによって解析不能としてフラグが立てられます。この契約内容は、`study-swarm lint`によってローカルでチェックされるため、ステップ3とステップ4では、引用の定義について合意が得られます。

## CLI（コマンドラインインターフェース）

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| コマンド | 実行内容 |
|---|---|
| `study-swarm protocol` | 完全なプロトコル（5つのステップ、停止テーブル、情報源の標準）を表示します。 |
| `study-swarm new <slug>` | 5つのステップで構成されたスケルトンを含む`<slug>.dispatch.md`を作成し、情報を入力できるようにします。 |
| `study-swarm lint [--json] <path…>` | ディスパッチの「研究根拠」を情報源の標準と比較してチェックします。すべての調査結果には、著者、年、および解決可能な識別子（arXiv / DOI / URL）が必要です。「研究によると…」という曖昧な表現は拒否されます。違反があった場合、終了コード`1`を返し、CI（継続的インテグレーション）のゲートとして機能します。`<path>`はファイル、ディレクトリ（`.dispatch.md`ファイルを再帰的にチェック）、または`-`（標準入力）を指定できます。`--json`オプションを使用すると、機械可読形式のレポートが出力されます。 |

`lint`は決定的な処理であり、モデルへの呼び出しは行われません。そのため、CI環境で安全に使用できます。ローカルで**ステップ3の情報源標準**を適用します。モデルベースの**ステップ4**の検証は、引き続き[`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prismによって行われます。

典型的なループ：

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

完全で`lint`によるチェックに合格したディスパッチ（study-swarmを自身の設計に適用したもの）は、[`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md)として、参考資料として提供されます。

### CI環境でゲートとして使用する

`lint`は、ファイル、ディレクトリ（`.dispatch.md`ファイルを再帰的にチェック）、または`-`（標準入力）を受け取り、`--json`オプションを使用すると、機械可読形式のレポートが出力されます。これをリポジトリに追加して、すべてのディスパッチの情報源を各PR（プルリクエスト）で検証します（コピー＆ペーストできるサンプルは[`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)にもあります）。

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

## その仕組み：

**現状** — この分野は急速に進化しており、特定の研究と年を指定することで、設計が18か月遅れて公開されるのを防ぎます。**機能性** — 証拠は、何が「有効」であるかだけでなく、何が「無効」であるかを示します（説明を加えることで、*誤った*AIへの過度な依存が増加する可能性があります—Bansal et al. 2021、[arXiv:2006.14779](https://arxiv.org/abs/2006.14779)）。**安全性** — 検証ツールによって保護された範囲は、証拠が裏付けるアーキテクチャであり、プロトコルはその出力を強制します。情報源の明示は、学術的な儀式ではなく、証拠の追跡です。

## セキュリティ

`study-swarm`は、**軽量で依存関係のないCLI（コマンドラインインターフェース）** (`study-swarm`)と、その方法論を一緒に提供します。**ネットワークへの接続やモデルへの呼び出しを行わず**、**テレメトリも収集しません**。ソースコードには秘密情報や認証情報は含まれていません。実行時に、`lint`に渡されたファイルを読み取り、現在のディレクトリに単一の`<slug>.dispatch.md`ファイルを作成するだけです（上書きはせず、作業ディレクトリ外に出力することはありません）。方法論で説明されているモデルベースの検証（ステップ4）は、このパッケージではなく、関連ツールによって実行されます。詳細は[SECURITY.md](SECURITY.md)を参照してください。

## ステータス

動作するプロトコルであり、自身のメカニズムによって外部から検証されています（異なるモデルファミリーがその引用をチェックします。上記の証拠を参照）。このリポジトリは公開されている参考資料です。[PROTOCOL.md](PROTOCOL.md)は、実行可能な形式です。これは、[dogfood-lab](https://github.com/dogfood-lab)ファミリーの一部であり、AI時代における構築のための方法と事例を紹介します。

MITライセンス。

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
