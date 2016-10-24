from xml.etree import cElementTree as ET
import re
import csv

def main():
	'''with open("data/export.xml") as f, open("data/export_clean.xml", "wb") as clean:
		reg = re.compile("^ (.*)$");
		for line in f:
			clean.write(reg.search(line).group(1));
			clean.write("\n");'''
	with open("data/export_clean.csv", "wb") as finalfile:
		type_reg = re.compile("^HKQuantityTypeIdentifier(.*)$");
		date_reg = re.compile("^(.*) -0400$");
		tree = ET.ElementTree(file="data/export_clean.xml");
		writer = csv.writer(finalfile);
		writer.writerow(["type","startDate","endDate","value"])
		for record in tree.getroot():
			fields = record.attrib;
			writer.writerow([type_reg.search(fields["type"]).group(1), date_reg.search(fields["startDate"]).group(1), date_reg.search(fields["endDate"]).group(1), fields["value"]])

if __name__ == "__main__":
	main();
