import csv
from datetime import datetime
from collections import defaultdict

def main():
	with open("data/export_clean.csv", "rb") as reader_f, open("data/summerHeatMap.csv", "wb") as summer_f, open("data/schoolHeatMap.csv", "wb") as school_f:
		reader = csv.reader(reader_f);
		summer_writer = csv.writer(summer_f);
		school_writer = csv.writer(school_f);

		summer_writer.writerow(["day","hour","value"]);
		school_writer.writerow(["day","hour","value"]);

		summerStepCount = defaultdict(lambda: defaultdict(float));
		schoolStepCount = defaultdict(lambda: defaultdict(float));
		summer_days = 0.0;
		school_days = 0.0;
		curr_hour = -1;
		curr_day = "";
		steps = 0;
		for line in reader:
			if line[0] == "Step":
				new_day = line[2];
				new_date = datetime.strptime(line[1], '%Y-%m-%d %H:%M:%S');
				new_hour = new_date.hour;

				if curr_day == new_day and curr_hour == new_hour:
					steps += float(line[5]);
				else:
					if isSummerDay(new_date):
						summerStepCount[curr_day][curr_hour] += steps;
					else:
						schoolStepCount[curr_day][curr_hour] += steps;

					curr_hour = new_hour;
					steps = 0;
					if not curr_day == new_day:
						curr_day = new_day;
						if isSummerDay(new_date):
							summer_days += 1.0;
						else:
							school_days += 1.0;

		writeToFile(school_writer, schoolStepCount, school_days);
		writeToFile(summer_writer, summerStepCount, summer_days);

def writeToFile(writer, stepCount, days):
	for day_of_the_week in stepCount:
		if not day_of_the_week == "":
			for hour in range(24):
				writer.writerow([day_of_the_week, hour, stepCount[day_of_the_week][hour] / days]);

def isSummerDay(date):
	return date.month >= 6 and date.month <= 8;

if __name__ == "__main__":
	main();