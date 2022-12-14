CREATE TABLE entities(
	fullname VARCHAR(40) PRIMARY KEY,
	type VARCHAR(20)
);

CREATE TABLE allOC(
	ocid INTEGER AUTO_INCREMENT,
	ref_text VARCHAR(1024),
	type VARCHAR(20),
	PRIMARY KEY(ocid)
);

CREATE TABLE disambiguationOC(
	ocid INTEGER PRIMARY KEY,
	fullname VARCHAR(20) NOT NULL,
	affiliation VARCHAR(40),
	position VARCHAR(40),
	role VARCHAR(40),
	evidence VARCHAR(1024),
	confidence INTEGER,
	ref_text VARCHAR(1024),
	FOREIGN KEY (ocid) REFERENCES allOC ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (fullname) REFERENCES entities ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE speculationOC(
	ocid INTEGER PRIMARY KEY,
	ref_text VARCHAR(1024),
	evidence VARCHAR(1024),
	confidence INTEGER,
	speculation VARCHAR(1024) NOT NULL,
	FOREIGN KEY (ocid) REFERENCES allOC ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE entityRelation(
	fullname1 VARCHAR(20),
	fullname2 VARCHAR(20),
	PRIMARY KEY (fullname1, fullname2),
	FOREIGN KEY (fullname1) REFERENCES entities ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (fullname2) REFERENCES entities ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE entityOCRelation(
	fullname VARCHAR(20),
	ocid INTEGER,
	confidence INTEGER,
	field VARCHAR(20),
	PRIMARY KEY (fullname, ocid),
	FOREIGN KEY (fullname) REFERENCES entities ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ocid) REFERENCES allOC ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE OCRelation(
	ocid1 INTEGER,
	ocid2 INTEGER,
	type VARCHAR(20),
	PRIMARY KEY (ocid1, ocid2),
	FOREIGN KEY (ocid1) REFERENCES allOC ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ocid2) REFERENCES allOC ON DELETE CASCADE ON UPDATE CASCADE
);

