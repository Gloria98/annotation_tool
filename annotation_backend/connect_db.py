import sqlite3
import flask
DATABASE_FILENAME = "../var/anno_tool.sqlite3"

def dict_factory(cursor, row):
    """Convert database row objects to a dictionary.

    This is useful for building dictionaries which are
    then used to render a template.  Note that
    this would be inefficient for large queries.
    """
    output = {}
    for idx, col in enumerate(cursor.description):
        output[col[0]] = row[idx]
    return output

def get_db():
    """Open a new database connection."""
    con = sqlite3.connect(DATABASE_FILENAME)

    return con


def query_db_1(con, query, args=(), one=False):
    """query_db_1."""
    cur = con.cursor()
    res = cur.execute(query, args)
    r_1 = res.fetchall()
    cur.close()
    return (r_1[0] if r_1 else None) if one else r_1

