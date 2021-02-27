import pandas as pd
import numpy as np
import datetime as dt

df_title = pd.read_csv('../data/soc-redditHyperlinks-title.tsv', sep='\t')
df_body = pd.read_csv('../data/soc-redditHyperlinks-body.tsv', sep='\t')
df_embeddings = pd.read_csv('../data/web-redditEmbeddings-subreddits.csv', header=None)
df_title.TIMESTAMP = pd.to_datetime(df_title.TIMESTAMP)
df_body.TIMESTAMP = pd.to_datetime(df_body.TIMESTAMP)
df_all = pd.concat([df_title, df_body])
df_embeddings.rename({0:'sub'}, axis=1, inplace=True)