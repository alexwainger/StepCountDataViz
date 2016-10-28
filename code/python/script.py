from xml.etree import cElementTree as ET
import re
import csv
from datetime import datetime
import calendar
from collections import defaultdict

def main():
	with open("data/export_clean.csv", "wb") as finalfile, open("data/steps_by_day.csv", "wb") as by_day:
		type_reg = re.compile("^HKQuantityTypeIdentifier(.*)$");
		date_reg = re.compile("^(.*) -0400$");
		tree = ET.ElementTree(file="data/export_clean.xml");
		writer = csv.writer(finalfile);
		by_day_writer = csv.writer(by_day);
		writer.writerow(["type","startDate","startDay","endDate","endDay","value"]);
		by_day_writer.writerow(["date","day","steps"]);

		day_tracker = defaultdict(int);
		date_to_day_of_week = {};
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
			line = [shorttype, startDate, start_day, endDate, end_day, fields["value"]];
			
			writer.writerow(line);

			if shorttype == "Step":
				date_string = start_obj.strftime('%Y-%m-%d');
				day_tracker[date_string] += int(fields["value"]);
				date_to_day_of_week[date_string] = start_day;

		for key in sorted(day_tracker):
			by_day_writer.writerow([key, date_to_day_of_week[key], day_tracker[key]]);

if __name__ == "__main__":
	main();
