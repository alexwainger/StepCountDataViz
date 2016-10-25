from xml.etree import cElementTree as ET
import re
import csv
from datetime import datetime
import calendar

def main():
	with open("data/export_clean.csv", "wb") as finalfile:
		type_reg = re.compile("^HKQuantityTypeIdentifier(.*)$");
		date_reg = re.compile("^(.*) -0400$");
		tree = ET.ElementTree(file="data/export_clean.xml");
		writer = csv.writer(finalfile);
		writer.writerow(["type","startDate","startDay","endDate","endDay","value"])

		for record in tree.getroot():
			fields = record.attrib;
			shorttype = {"StepCount":"Step",
						"DistanceWalkingRunning": "Dist",
						"FlightsClimbed": "Flights"}[type_reg.search(fields["type"]).group(1)]

			startDate = date_reg.search(fields["startDate"]).group(1);
			endDate = date_reg.search(fields["endDate"]).group(1);

			start_obj = datetime.strptime(startDate, '%Y-%m-%d %H:%M:%S');
			start_day = calendar.day_name[start_obj.weekday()];

			end_obj = datetime.strptime(endDate, '%Y-%m-%d %H:%M:%S');
			end_day = calendar.day_name[end_obj.weekday()];

			writer.writerow([shorttype, startDate, start_day, endDate, end_day, fields["value"]])

if __name__ == "__main__":
	main();
