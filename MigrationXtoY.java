//**************************************************
//
//  Copyright %year% SOASTA, Inc.
//  All rights reserved.
//  Proprietary and confidential.
//
//  File:  Migration%from%to%to%.java
//  Contains the Migration3557to3558 class.
//
//  This file contains the Migration%from%to%to% class.
//
//**************************************************

package com.soasta.repository.persistence.migration;

public class Migration%from%to%to% extends MigrationBase
{
  @Override
  public void migrate() throws Exception
  {
    getSQLHelper().executeSql("UPDATE SiteConfiguration SET BoomerangDefaultVersion='%version%'");
  }
}

