# Generate airway DESeq2 results for ggterm bundled dataset
# Requires: BiocManager::install(c("airway", "DESeq2", "org.Hs.eg.db"))
# Usage: Rscript generate-airway.R > airway-data.json

library(airway)
library(DESeq2)
library(org.Hs.eg.db)

data(airway)
dds <- DESeqDataSet(airway, design = ~ dex)
dds <- DESeq(dds)
res <- results(dds)
res_df <- as.data.frame(res)
res_df$ensembl <- rownames(res_df)

# Annotate with gene symbols
symbols <- mapIds(org.Hs.eg.db, keys = res_df$ensembl,
                  keytype = "ENSEMBL", column = "SYMBOL")
res_df$gene <- ifelse(is.na(symbols[res_df$ensembl]),
                       res_df$ensembl, symbols[res_df$ensembl])

# Remove rows with NA padj
res_df <- res_df[!is.na(res_df$padj), ]

# Stratified sample for a good-looking volcano plot
set.seed(42)
sig_up   <- res_df[res_df$padj < 0.05 & res_df$log2FoldChange > 1, ]
sig_down <- res_df[res_df$padj < 0.05 & res_df$log2FoldChange < -1, ]
nonsig   <- res_df[res_df$padj >= 0.05 | abs(res_df$log2FoldChange) <= 1, ]

selected <- rbind(
  sig_up[sample(nrow(sig_up), min(100, nrow(sig_up))), ],
  sig_down[sample(nrow(sig_down), min(100, nrow(sig_down))), ],
  nonsig[sample(nrow(nonsig), min(300, nrow(nonsig))), ]
)

# Keep relevant columns, round numbers
out <- data.frame(
  gene           = selected$gene,
  baseMean       = round(selected$baseMean, 2),
  log2FoldChange = round(selected$log2FoldChange, 4),
  lfcSE          = round(selected$lfcSE, 4),
  pvalue         = signif(selected$pvalue, 4),
  padj           = signif(selected$padj, 4),
  stringsAsFactors = FALSE
)

cat(jsonlite::toJSON(out, pretty = FALSE, auto_unbox = TRUE))
