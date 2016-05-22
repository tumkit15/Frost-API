<?php
namespace Models;

class Application
{
	public static function create($userId, $name, $description, $config, DatabaseManager $db)
	{
		$now = time();

		try
		{
			$applications = $db->executeQuery('select * from frost_application where name = ?', [$name])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to search database record');
		}

		if (count($applications) !== 0)
			throw new ApiException('already exists.');

		try
		{
			$db->executeQuery('insert into frost_application (creator_id, created_at, name, description) values(?, ?, ?, ?)', [$userId, $now, $name, $description]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$application = $db->executeQuery('select * from frost_application where creator_id = ? & name = ?', [$userId, $name])->fetch()[0];

		$key = ApplicationKey::create($application['id'], $config, $db);

		$application['key'] = $key;

		return $application;
	}

	public static function fetch($id, DatabaseManager $db)
	{
		try
		{
			$apps = $db->executeQuery('select * from frost_application where id = ?', [$id])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new ApiException('application not found');

		return $apps[0];
	}
}