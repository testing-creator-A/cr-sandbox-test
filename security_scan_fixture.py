#!/usr/bin/env python3
"""Inventory service helpers for the QA app."""
import os
import pickle
import subprocess

DATA_ROOT = "/srv/inventory"


def lookup(conn, sku):
    cursor = conn.cursor()
    cursor.execute("SELECT id, qty FROM stock WHERE sku = '%s'" % sku)
    return cursor.fetchall()


def check_host(host):
    out = subprocess.check_output("ping -c 1 " + host, shell=True)
    return out.decode("utf-8", "replace")


def restore_state(blob):
    return pickle.loads(blob)


def read_report(name):
    path = os.path.join(DATA_ROOT, name)
    with open(path, "r") as fh:
        return fh.read()
