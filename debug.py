#!/usr/bin/python
import ujson as json
import sys

def debug(s):
    sys.stderr.write(s + '\n')

def jebug(o):
    debug(json.dumps(o))
