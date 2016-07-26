<?php

class User
{
	/**
	 * @param $req
	 * @param $res
	 * @param $container
	 * @param $user
	 * @param $application
	 * @return mixed
	 * @throws \Utility\ApiException
	 */
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['screen-name', 'password'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$createdUser = \Models\User::create($params['screen-name'], $params['password'], 'froster', $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData());
		}

		return withSuccess($res, ['user'=>$createdUser]);
	}

	public static function show($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['user-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$destUser = \Models\User::fetch($params['user-id'], $container);

		return withSuccess($res, ['user'=>$destUser]);
	}
}
