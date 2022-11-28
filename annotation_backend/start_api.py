import json
import time
import os
from markupsafe import escape
import requests
import wikipediaapi
from connect_db import get_db

from flask import Flask, jsonify, request, session
from flask_cors import CORS, cross_origin

app = Flask(__name__, static_url_path='/static')
CORS(app)

'''
Load transcript data. Transcripts are stored in .json
Transcripts with newly added annotations are stored in update_{filename}
If the updated transcript doesn't exist, then return the original transcript, with entity annotation from spacy
'''
@app.route('/files/<filename>', methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def obtain_json_file(filename):
    if os.path.exists(f'../../data_json/update_{escape(filename)}'):
        with open(f'../../data_json/update_{escape(filename)}', 'r') as f:
            data = json.load(f)
    else:
        with open(f'../../data_json/{escape(filename)}', 'r') as f:
            data = json.load(f)
    
    response = jsonify(data)
    return response

'''
Save the transcript with user-added annotations
'''
@app.route('/save_files/<filename>', methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def save_json_file(filename):
    data = request.get_json(force=True)
    print(data)
    with open(f'../../data_json/update_{escape(filename)}', 'w') as f:
        json.dump(data, f)
    
    response = {"saved": True}
    return response

'''
Search for entity in wikipedia
'''
@app.route('/entities', methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def find_enetity():
    args = request.args
    print(args)
    entity_name = args['entity']

    S = requests.Session()
    URL = "https://en.wikipedia.org/w/api.php"
    wiki_wiki = wikipediaapi.Wikipedia('en', extract_format=wikipediaapi.ExtractFormat.WIKI)

    SEARCHPAGE = entity_name
    if args['type'] == 'entity-PERSON':
        SEARCHPAGE += " watergate"

    PARAMS = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": SEARCHPAGE
    }

    # search for candidate entities from wikipedia
    R = S.get(url=URL, params=PARAMS)
    DATA = R.json()
    data = []
    # con = get_db()

    entity_list = []
    relation_list = []
    # process the top 5 returned candidates
    for candidate in DATA['query']['search'][:5]:
        candidate_json = {}
        cand_full_name = candidate['title']
        cand_pageid = str(candidate['pageid'])
        candidate_json['title'] = cand_full_name

        entity_list.append(cand_full_name)
        # obtain the entity summary
        cand_title = '_'.join(cand_full_name.split(' '))
        link = f"https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles={cand_title}"
        x = requests.get(link)
        cand_summary = x.json()['query']['pages'][cand_pageid]['extract']

        # obtain related entities
        link = f"https://en.wikipedia.org/w/api.php?action=parse&prop=links&page={cand_title}&section=0&format=json"
        x = requests.get(link)
        entities = [entity['*'] for entity in x.json()['parse']['links']]
        entities = [entity for entity in entities if len(entity.split(':'))==1]
        candidate_json['summary'] = cand_summary
        candidate_json['entities'] = entities
        candidate_json['eid'] = candidate['pageid']
        for entity in entities:
            entity_list.append(entity)
            relation_list.append((cand_full_name, entity) if cand_full_name<entity else (entity, cand_full_name))

        data.append(candidate_json)
    
    unique_entities = list(set(entity_list))
    unique_relations = list(set(relation_list))
    
    response = jsonify(data)

    return response

@app.route('/save_disambig', methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def save_disambiguation_oc():
    json_data = request.get_json(force=True)
    fullname = json_data['fullname']
    # save to entities
    con = get_db()
    cur = con.cursor()
    cur.execute("INSERT INTO entities(fullname) SELECT ? WHERE NOT EXISTS (SELECT fullname FROM entities WHERE fullname=?)", 
                     (fullname, fullname))
    con.commit()
    if 'related_entities' in json_data:
        for entity in json_data['related_entities']:
            cur.execute("INSERT INTO entities(fullname) SELECT ? WHERE NOT EXISTS (SELECT fullname FROM entities WHERE fullname=?)", 
                     (entity, entity))
        con.commit()
        for entity in json_data['related_entities']:
            entity_pair = (entity, fullname) if entity<fullname else (fullname, entity)
            cur.execute("INSERT INTO entityRelation(fullname1, fullname2) "
                    "SELECT ?,? WHERE NOT EXISTS "
                    "(SELECT fullname1, fullname2 FROM entityRelation "
                    "WHERE fullname1=? AND fullname2=?)", 
                    (entity_pair[0], entity_pair[1], entity_pair[0], entity_pair[1]))
        con.commit()
    # insert into allOC
    res = cur.execute("INSERT INTO allOC(ref_text, type) VALUES (?,?)", (json_data['ref_text'], 'disambiguation'))
    # generate a ROWID
    ocid = cur.lastrowid
    con.commit()
    # insert into disambiguationOC
    res = cur.execute("INSERT INTO disambiguationOC(ocid,fullname,affiliation,position,role,evidence,confidence,ref_text) VALUES (?,?,?,?,?,?,?,?)",
            (ocid, fullname, json_data['affiliation'], json_data['position'], json_data['role'], json_data['evidence'], json_data['confidence'], json_data['ref_text']))
    con.commit()
    cur.close()
    
    data = {'status': 'saved', 'ocid': ocid}
    response = jsonify(data)

    return response

'''
Extract a saved oc from the data base
'''
@app.route('/get_comments/<ocid>', methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def obtain_oc(ocid):
    con = get_db()
    cur = con.cursor()
    print(ocid)
    # find oc type
    res = cur.execute("SELECT type FROM allOC WHERE rowid=?", (int(ocid),))
    oc_type = res.fetchone()[0]
    # disambiguation oc
    if oc_type == "disambiguation":
        oc_content = cur.execute("SELECT * FROM disambiguationOC WHERE ocid=?", (ocid, )).fetchone()
        print(oc_content)
        response = {
            "oc_type": oc_type,
            "oc_content": {
                "ocid": oc_content[0],
                "fullname": oc_content[1],
                "affiliation": oc_content[2],
                "position": oc_content[3],
                "role": oc_content[4],
                "evidence": oc_content[5],
                "confidence": oc_content[6],
                "ref_text": oc_content[7],
            }
        }
        response = jsonify(response)
        return response

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug = True, port = 8985)