import json
import pandas as pd
import numpy as np
import datetime as dt
from io import StringIO
from flask import Flask, render_template, request, send_from_directory, jsonify, send_file
from flask_socketio import SocketIO, emit, send

# Temp
DEBUG = True
app = Flask(__name__)
app.config.from_object(__name__)
app.jinja_env.globals.update(zip=zip)
app.config['SECRET_KEY'] = '7d441f27d441f27567d441f2b6176a'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 1
socketio = SocketIO(app)

# link_limit = 100_000

def split_sentiment(df):
    mask = df.sentiment == 1
    return [df[mask], df[~mask]]

df_points = pd.read_csv('../data/projections/perp_10_2500subs.csv')
df_title = pd.read_csv('../data/soc-redditHyperlinks-title.tsv', sep='\t')
df_body = pd.read_csv('../data/soc-redditHyperlinks-body.tsv', sep='\t')
df_all = pd.concat([df_title, df_body])

all_subs = set()
all_subs.update(df_points['sub'])

df_all = df_all[df_all.SOURCE_SUBREDDIT.map(lambda x: x in all_subs) & df_all.TARGET_SUBREDDIT.map(lambda x: x in all_subs)]
df_all.TIMESTAMP = pd.to_datetime(df_all.TIMESTAMP)
df_all.columns = "source target post_id timestamp sentiment props".split()

df_source = df_all.set_index('source')
df_target = df_all.set_index('target')
df_current = df_all

# Shift to 0 origin
x_shift = df_points.x.min()
y_shift = df_points.y.min()
df_points.x = df_points.x + (-x_shift)
df_points.y = df_points.y +(-y_shift)

# Scent Calculations
bins = pd.cut(df_all.timestamp, 50)
df_all['bin'] = bins
pos_rows,neg_rows = split_sentiment(df_all)

# print(pos_rows)

def compute_links(df):
    links = df.groupby(['source', 'target', 'sentiment'])['post_id'].count().reset_index()
    links.columns = 'source target sentiment n'.split()
    links = links.sort_values(by='n', ascending=False)
    return links

with open('../data/tags/tag_hierarchical.json', 'r') as f:
    tag_graph = json.load(f)

with open('../data/tags/tag_filter.json', 'r') as f:
    tag_filter = json.load(f)
    

def prepare_csv(df):
    csv_obj = StringIO()
    df.to_csv(csv_obj, index=False)
    csv_ready = csv_obj.getvalue()
    csv_obj.close()
    return csv_ready

###### ROUTES ######

@app.route("/", methods=['POST', 'GET'])
def home():
    first_link = df_all.timestamp.min().ctime()
    last_link = df_all.timestamp.max().ctime()
    return render_template('index.html', first_link=first_link, last_link=last_link)

@app.route('/data')
def serve_data():
    if request.args.get('g') == 'volume_hist':
        df_vol = pd.DataFrame(pos_rows.groupby('bin')['post_id'].count().values, columns=['positive'])
        df_vol['negative'] = neg_rows.groupby('bin')['post_id'].count().values
        return prepare_csv(df_vol)

    if request.args.get('g') == 'sub_points':
        return prepare_csv(df_points)

    if request.args.get('g') == 'tag_graph':
        return jsonify(tag_graph)

    if request.args.get('g') == 'tag_filter':
        return jsonify(tag_filter)   

# @socketio.on('date_change')
# def on_date_update(dates):
#     df_current = df_all
#     emit('update_graph', {'one':'msg'})
    
# @socketio.on('label_change')
# def on_label_update(dates):
#     df_current = df_all
#     emit('update_graph', {'one':'msg'})

# @app.route("/jsondata",methods=["GET","POST"])
# def returnjson():
#     return send_file("../data/sourcetarget.json")

@app.route("/nodes",methods=["GET","POST"])
def get_nodes():
    links = compute_links(df_all)
    # links_trunc = links[:link_limit]
    links_trunc = links
    sub_set = set()
    sub_set.update(links_trunc.source)
    sub_set.update(links_trunc.target)
    points = df_points[df_points['sub'].map(lambda x: x in sub_set)]
    return prepare_csv(points)

@app.route("/links",methods=["GET"])
def get_links():
    df = df_all
    start = request.args.get('start_date')
    if start:
        start = dt.datetime.fromisoformat(start)
        end = dt.datetime.fromisoformat(request.args.get('end_date'))
        df = df[(df.timestamp >= start) & (df.timestamp <= end)]
    links = compute_links(df)
    return prepare_csv(links.iloc[:])



# @app.route("/sentiment_nodes",methods=["GET","POST"])
# def get_sent_nodes():
#     if request.args.get('s') == 'pos':
#         links = compute_links(pos_rows)
#     elif request.args.get('s') == 'neg':
#         links = compute_links(neg_rows)

#     links_trunc = links[:]
#     sub_set = set()
#     sub_set.update(links_trunc.source)
#     sub_set.update(links_trunc.target)
#     points = df_points[df_points['sub'].map(lambda x: x in sub_set)]
#     return prepare_csv(points)

@app.route("/sentiment_links",methods=["GET","POST"])
def get_sent_links():
    if request.args.get('s') == 'pos':
        links = compute_links(pos_rows)
    elif request.args.get('s') == 'neg':
        links = compute_links(neg_rows)
    return prepare_csv(links.iloc[:])


def filter_data():
    # Filter by Date
    # df_current
    # df_current = 
    # Filter by Source
    # df_current =
    # Filter by Destination
    # df_current
    pass

def create_links():
    pass

def create_node_sumamry():
    pass

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', use_reloader = True)