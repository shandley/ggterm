# Generate lung survival data for ggterm bundled dataset
# Requires: survival package (included with base R)
# Usage: Rscript generate-lung.R > lung-data.json

library(survival)
data(lung)

out <- data.frame(
  time    = lung$time,
  status  = lung$status - 1,  # R uses 1=censored, 2=dead -> 0/1
  age     = lung$age,
  sex     = ifelse(lung$sex == 1, "male", "female"),
  ph_ecog = lung$ph.ecog,
  stringsAsFactors = FALSE
)

# Remove rows with NA ph_ecog
out <- out[!is.na(out$ph_ecog), ]

cat(jsonlite::toJSON(out, pretty = FALSE, auto_unbox = TRUE))
